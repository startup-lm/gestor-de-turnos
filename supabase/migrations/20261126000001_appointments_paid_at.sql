-- Fecha y hora real del cobro de un turno (distinta de la fecha del turno en cobros por adelantado).
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE NULL;

-- Backfill: los turnos ya cobrados que están en una caja toman la apertura de esa caja
-- (aproximación: el cobro ocurrió dentro de esa caja). Los cobrados sin caja quedan en NULL.
UPDATE public.appointments a
SET paid_at = s.opened_at
FROM public.cash_shifts s
WHERE a.shift_id = s.id
  AND a.paid = true
  AND a.paid_at IS NULL;
