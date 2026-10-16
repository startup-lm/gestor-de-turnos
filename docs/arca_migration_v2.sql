-- ============================================================
-- ARCA Integration v2 — Migración de trazabilidad
-- Ejecutar en el SQL Editor de Supabase (en orden)
-- ============================================================

-- 1. Extender arca_invoices con campos de origen y tipo de documento
ALTER TABLE arca_invoices
  ADD COLUMN IF NOT EXISTS source_type    text,    -- 'appointment' | 'sale' | 'manual'
  ADD COLUMN IF NOT EXISTS source_id      bigint,  -- ID del turno o venta asociado
  ADD COLUMN IF NOT EXISTS doc_type       int,     -- Tipo documento: 80=CUIT, 86=CUIL, 96=DNI, 99=Consumidor Final
  ADD COLUMN IF NOT EXISTS doc_number     text,    -- Número de documento del cliente
  ADD COLUMN IF NOT EXISTS invoice_type   int DEFAULT 11; -- Tipo comprobante: 6=Factura B, 11=Factura C

-- 2. Extender appointments con referencia al comprobante emitido
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS arca_invoice_id bigint REFERENCES arca_invoices(id) ON DELETE SET NULL;

-- 3. Extender sales con referencia al comprobante emitido
ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS arca_invoice_id bigint REFERENCES arca_invoices(id) ON DELETE SET NULL;

-- 4. Índices para consultas de trazabilidad
CREATE INDEX IF NOT EXISTS idx_arca_invoices_source
  ON arca_invoices (source_type, source_id);

CREATE INDEX IF NOT EXISTS idx_appointments_arca_invoice
  ON appointments (arca_invoice_id)
  WHERE arca_invoice_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sales_arca_invoice
  ON sales (arca_invoice_id)
  WHERE arca_invoice_id IS NOT NULL;

-- 5. Comentarios descriptivos en columnas nuevas
COMMENT ON COLUMN arca_invoices.source_type  IS 'Origen del comprobante: appointment | sale | manual';
COMMENT ON COLUMN arca_invoices.source_id    IS 'ID del turno o venta que originó el comprobante';
COMMENT ON COLUMN arca_invoices.doc_type     IS 'Tipo documento ARCA: 80=CUIT, 86=CUIL, 96=DNI, 99=Consumidor Final';
COMMENT ON COLUMN arca_invoices.doc_number   IS 'Número de documento del cliente';
COMMENT ON COLUMN arca_invoices.invoice_type IS 'Tipo comprobante ARCA: 6=Factura B, 11=Factura C';
COMMENT ON COLUMN appointments.arca_invoice_id IS 'FK al comprobante ARCA emitido para este turno';
COMMENT ON COLUMN sales.arca_invoice_id        IS 'FK al comprobante ARCA emitido para esta venta';
