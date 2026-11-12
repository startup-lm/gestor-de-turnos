ALTER TABLE public.arca_invoices ADD COLUMN IF NOT EXISTS environment TEXT;
UPDATE public.arca_invoices
  SET environment = COALESCE((SELECT environment FROM public.arca_settings WHERE id = 1), 'homo')
  WHERE environment IS NULL;
ALTER TABLE public.arca_invoices ALTER COLUMN environment SET DEFAULT 'homo';
CREATE INDEX IF NOT EXISTS idx_arca_invoices_environment ON public.arca_invoices(environment);
