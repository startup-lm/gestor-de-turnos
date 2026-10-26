-- ==============================================================================
-- MIGRACIÓN DE PERFORMANCE: Índices y Optimización de Consultas Frecuentes
-- Versión: 20261019000000_performance_indexes.sql
-- ==============================================================================

-- 1. Índice parcial para turnos activos (descartando turnos cancelados/soft-deleted)
-- Optimiza consultas de calendario y filtros por rango de fechas
CREATE INDEX IF NOT EXISTS idx_appointments_active 
ON public.appointments(date, barber_id, start_time) 
WHERE deleted_at IS NULL;

-- 2. Índice compuesto para ventas por barbero y fecha (reportes y balances financieros)
CREATE INDEX IF NOT EXISTS idx_sales_barber_date 
ON public.sales(barber_id, created_at DESC);

-- 3. Índice para evitar escaneos secuenciales en validaciones de cliente por teléfono
CREATE INDEX IF NOT EXISTS idx_appointments_real_clients 
ON public.appointments(phone, date) 
WHERE phone IS NOT NULL AND phone != '0000000000';

-- 4. Índice para ordenamiento de clientes recurrentes por última visita
CREATE INDEX IF NOT EXISTS idx_clients_last_visit 
ON public.clients(last_visit_date DESC);
