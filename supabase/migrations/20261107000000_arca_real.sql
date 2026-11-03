-- =====================================================================
-- Facturación ARCA real (v1.9.0)
--   1. Ticket de acceso de WSAA guardado: dura 12 h y ARCA rechaza pedir
--      otro mientras el anterior sigue vigente.
--   2. Sin modo demo: el entorno por defecto pasa a homologación.
--   3. arca_invoices guarda la condición de IVA del receptor y el motivo
--      de rechazo de ARCA.
-- Migración aditiva: columnas nullable, el código anterior las ignora.
-- =====================================================================

-- 1. Ticket de acceso -------------------------------------------------------
ALTER TABLE public.arca_settings
  ADD COLUMN IF NOT EXISTS wsaa_token TEXT,
  ADD COLUMN IF NOT EXISTS wsaa_sign TEXT,
  ADD COLUMN IF NOT EXISTS wsaa_expires_at TIMESTAMPTZ;

-- 2. Sin modo demo ----------------------------------------------------------
ALTER TABLE public.arca_settings
  ALTER COLUMN environment SET DEFAULT 'homo';

UPDATE public.arca_settings SET environment = 'homo' WHERE environment = 'mock';

-- 3. Datos del comprobante --------------------------------------------------
ALTER TABLE public.arca_invoices
  ADD COLUMN IF NOT EXISTS receiver_iva_condition INTEGER,
  ADD COLUMN IF NOT EXISTS error_message TEXT;
