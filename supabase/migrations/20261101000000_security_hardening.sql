-- =====================================================================
-- Hardening de seguridad (v1.5.0)
-- 1. RLS en todas las tablas: la anon key (pública) deja de poder leer/escribir directo.
--    La app accede vía API Routes con service_role, que saltea RLS.
-- 2. Política de lectura de appointments para staff autenticado (realtime del calendario).
-- 3. Rate limit persistente compartido entre instancias serverless.
-- 4. Columna plan en business_settings (planes en lugar de flags sueltos).
-- Migración aditiva: no renombra ni elimina columnas.
-- =====================================================================

-- 1. RLS ---------------------------------------------------------------
ALTER TABLE public.appointments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arca_invoices         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arca_settings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbers               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_hours_global ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services              ENABLE ROW LEVEL SECURITY;
-- cash_shifts, cash_movements y commission_payouts ya tienen RLS (20261028000000)

-- 2. Realtime del calendario: solo staff activo (barbero o admin) puede leer turnos.
--    Los anónimos ven disponibilidad únicamente vía /api/appointments (datos enmascarados).
DROP POLICY IF EXISTS "staff_can_read_appointments" ON public.appointments;
CREATE POLICY "staff_can_read_appointments"
  ON public.appointments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.barbers b
      WHERE lower(b.email) = lower(auth.jwt() ->> 'email')
        AND b.active = true
        AND b.role IN ('admin', 'barber')
    )
  );

-- La política anterior consulta barbers con los permisos del usuario autenticado:
-- se le permite leer solo su propia fila.
DROP POLICY IF EXISTS "staff_can_read_own_barber_row" ON public.barbers;
CREATE POLICY "staff_can_read_own_barber_row"
  ON public.barbers
  FOR SELECT
  TO authenticated
  USING (lower(email) = lower(auth.jwt() ->> 'email'));

-- 3. Rate limit --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key          TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  count        INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Ventana fija atómica: devuelve la cantidad de pedidos en la ventana actual (incluido este).
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_key TEXT, p_limit INTEGER, p_window_seconds INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO public.rate_limits AS rl (key, window_start, count)
  VALUES (p_key, NOW(), 1)
  ON CONFLICT (key) DO UPDATE
    SET count = CASE
          WHEN rl.window_start < NOW() - make_interval(secs => p_window_seconds) THEN 1
          ELSE rl.count + 1
        END,
        window_start = CASE
          WHEN rl.window_start < NOW() - make_interval(secs => p_window_seconds) THEN NOW()
          ELSE rl.window_start
        END
  RETURNING count INTO v_count;

  -- Limpieza oportunista de claves viejas (1% de las llamadas)
  IF random() < 0.01 THEN
    DELETE FROM public.rate_limits WHERE window_start < NOW() - INTERVAL '1 day';
  END IF;

  RETURN v_count;
END;
$$;

-- Solo el servidor (service_role) puede usarla
REVOKE ALL ON FUNCTION public.check_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INTEGER, INTEGER) TO service_role;

-- 4. Planes ------------------------------------------------------------
-- Default 'basic' = todas las features apagadas (regla: todo nace apagado).
-- Los overrides existentes en business_settings.features siguen teniendo prioridad.
ALTER TABLE public.business_settings
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'basic';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'business_settings_plan_check'
  ) THEN
    ALTER TABLE public.business_settings
      ADD CONSTRAINT business_settings_plan_check CHECK (plan IN ('basic', 'pro'));
  END IF;
END $$;
