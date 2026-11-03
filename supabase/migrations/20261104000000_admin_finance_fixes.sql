-- Migración aditiva: medio de pago en ventas y anulación de movimientos y liquidaciones.
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS payment_method TEXT;

ALTER TABLE public.commission_payouts
  ADD COLUMN IF NOT EXISTS voided_at TIMESTAMPTZ;

ALTER TABLE public.cash_movements
  ADD COLUMN IF NOT EXISTS voided_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payout_id BIGINT REFERENCES public.commission_payouts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_cash_movements_payout_id ON public.cash_movements(payout_id);
CREATE INDEX IF NOT EXISTS idx_commission_payouts_barber_period ON public.commission_payouts(barber_id, period_start, period_end);
