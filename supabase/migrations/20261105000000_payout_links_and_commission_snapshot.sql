-- =====================================================================
-- Liquidaciones atadas a turnos y ventas + comisión congelada (v1.9.0)
--   1. payout_id en appointments y sales: la liquidación que pagó cada uno.
--      Un cobro atrasado entra en la próxima liquidación y lo liquidado
--      no se puede editar sin anular la liquidación.
--   2. commission_rate en appointments y sales: el % vigente al cobrar.
--      Si cambia el % del barbero, los números viejos no se recalculan.
--   3. Los retiros del dueño dejan de contarse como gasto.
-- Migración aditiva: columnas nullable, el código anterior las ignora.
-- =====================================================================

-- 1 y 2. Columnas nuevas ---------------------------------------------------
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS payout_id BIGINT REFERENCES public.commission_payouts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC;

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS payout_id BIGINT REFERENCES public.commission_payouts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC;

CREATE INDEX IF NOT EXISTS idx_appointments_payout_id ON public.appointments(payout_id);
CREATE INDEX IF NOT EXISTS idx_sales_payout_id ON public.sales(payout_id);

-- Relleno: lo cobrado dentro del período de una liquidación vigente queda
-- marcado con ella, para que la próxima liquidación no lo vuelva a pagar.
UPDATE public.appointments a
SET payout_id = p.id
FROM public.commission_payouts p
WHERE p.voided_at IS NULL
  AND a.payout_id IS NULL
  AND a.barber_id = p.barber_id
  AND a.paid = true
  AND a.deleted_at IS NULL
  AND a.date BETWEEN p.period_start AND p.period_end;

UPDATE public.sales s
SET payout_id = p.id
FROM public.commission_payouts p
WHERE p.voided_at IS NULL
  AND s.payout_id IS NULL
  AND s.barber_id = p.barber_id
  AND s.created_at BETWEEN p.period_start AND p.period_end;

-- 3. Retiros del dueño ------------------------------------------------------
UPDATE public.cash_movements
SET type = 'withdrawal'
WHERE type = 'expense'
  AND category = 'retiro_dueno';
