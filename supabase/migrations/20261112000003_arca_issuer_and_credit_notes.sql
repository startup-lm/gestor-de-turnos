-- =====================================================================
-- Datos fiscales del emisor y notas de crédito en ARCA
--   1. arca_settings: datos fiscales requeridos para el comprobante legal
--      (razón social, domicilio comercial, IIBB, inicio de actividades).
--   2. arca_invoices: soporte de notas de crédito C asociadas y fecha
--      efectiva del comprobante.
-- =====================================================================

-- 1. Datos fiscales del emisor -----------------------------------------------
ALTER TABLE public.arca_settings
  ADD COLUMN IF NOT EXISTS legal_name TEXT,
  ADD COLUMN IF NOT EXISTS fiscal_address TEXT,
  ADD COLUMN IF NOT EXISTS gross_income TEXT,
  ADD COLUMN IF NOT EXISTS activity_start_date DATE;

-- 2. Notas de crédito asociadas y fecha de comprobante -----------------------
ALTER TABLE public.arca_invoices
  ADD COLUMN IF NOT EXISTS credit_note_of_id BIGINT REFERENCES public.arca_invoices(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS voucher_date DATE;

CREATE INDEX IF NOT EXISTS idx_arca_invoices_credit_note_of_id
  ON public.arca_invoices(credit_note_of_id);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_arca_invoices_one_credit_note
  ON public.arca_invoices(credit_note_of_id)
  WHERE credit_note_of_id IS NOT NULL AND status <> 'rejected';
