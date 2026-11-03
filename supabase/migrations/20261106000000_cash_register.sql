-- =====================================================================
-- Caja diaria (v1.9.0)
--   1. shift_id en appointments y sales: la caja que estaba abierta al cobrar.
--      Lo esperado en una caja es la suma de lo que tiene su shift_id.
--   2. method_totals en cash_shifts: al cerrar, esperado y contado por medio de pago.
--   3. Una sola caja abierta por local, garantizado por la base.
-- Migración aditiva: columnas nullable, el código anterior las ignora.
-- =====================================================================

-- 1. Caja de cada cobro ----------------------------------------------------
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS shift_id BIGINT REFERENCES public.cash_shifts(id) ON DELETE SET NULL;

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS shift_id BIGINT REFERENCES public.cash_shifts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_shift_id ON public.appointments(shift_id);
CREATE INDEX IF NOT EXISTS idx_sales_shift_id ON public.sales(shift_id);

-- 2. Arqueo por medio de pago ----------------------------------------------
-- Formato: [{ "method": "Efectivo", "expected": 1000, "counted": 980 }, ...]
ALTER TABLE public.cash_shifts
  ADD COLUMN IF NOT EXISTS method_totals JSONB;

-- 3. Una sola caja abierta -------------------------------------------------
-- Si dos personas abren la caja a la vez, la segunda inserción falla (23505).
CREATE UNIQUE INDEX IF NOT EXISTS uniq_cash_shifts_one_open
  ON public.cash_shifts (status)
  WHERE status = 'open';
