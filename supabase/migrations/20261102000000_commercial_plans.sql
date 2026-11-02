-- ==========================================================================
-- Migración: planes comerciales basic / standard / premium
-- Versión: 20261102000000_commercial_plans.sql
--
-- Reemplaza el plan placeholder 'pro' por los tres planes definidos.
-- Qué incluye cada plan vive en código (PLAN_FEATURES / PLAN_LIMITS en lib/flags).
-- ==========================================================================

-- 1. Los clientes que tenían 'pro' pasan a 'premium' (el plan más completo)
UPDATE public.business_settings SET plan = 'premium' WHERE plan = 'pro';

-- 2. Nuevo CHECK con los tres planes
ALTER TABLE public.business_settings DROP CONSTRAINT IF EXISTS business_settings_plan_check;
ALTER TABLE public.business_settings
  ADD CONSTRAINT business_settings_plan_check CHECK (plan IN ('basic', 'standard', 'premium'));
