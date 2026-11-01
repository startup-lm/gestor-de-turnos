-- =====================================================================
-- Cierre de policies abiertas (v1.6.1)
-- La app lee y escribe todo vía API Routes con service_role (saltea RLS).
-- La anon key solo se usa para login y para el realtime del calendario,
-- así que las policies públicas heredadas sobran y exponían datos:
--   - appointments: cualquiera con la anon key leía nombres y teléfonos,
--     creaba turnos salteando la validación de la API, y cualquier usuario
--     autenticado podía editar o borrar físicamente cualquier turno.
--   - business_settings: la lectura pública exponía columnas privadas
--     (api_key de Google, plan, features, datos fiscales).
-- Queda únicamente "staff_can_read_appointments" (realtime del calendario)
-- y "staff_can_read_own_barber_row" (la usa la policy anterior).
-- =====================================================================

-- 1. Turnos -------------------------------------------------------------
DROP POLICY IF EXISTS "Permitir lectura de turnos propios por telefono" ON public.appointments;
DROP POLICY IF EXISTS "Permitir insercion anonima de turnos" ON public.appointments;
DROP POLICY IF EXISTS "Permitir actualizacion de turnos para usuarios autenticados" ON public.appointments;
DROP POLICY IF EXISTS "Permitir eliminacion de turnos para usuarios autenticados" ON public.appointments;

-- 2. Lecturas públicas (el sitio las obtiene vía API ya saneadas) --------
DROP POLICY IF EXISTS "Permitir lectura publica de configuraciones" ON public.business_settings;
DROP POLICY IF EXISTS "Permitir lectura publica de horarios" ON public.business_hours_global;
DROP POLICY IF EXISTS "Permitir lectura publica de productos" ON public.products;
DROP POLICY IF EXISTS "Permitir lectura publica de servicios" ON public.services;

-- 3. Storage: mismos límites que valida /api/storage (5 MB, solo imágenes) -
UPDATE storage.buckets
SET file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id IN ('barbers', 'services', 'products');

-- 4. Flag obsoleto reemplazado por los planes en v1.6.0 -------------------
UPDATE public.business_settings
SET features = features - 'cash_management'
WHERE features ? 'cash_management';
