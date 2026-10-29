-- ==============================================================================
-- MIGRACIÓN: Módulo de Google Reviews (Reseñas de Google)
-- Versión: 20261029000000_google_reviews.sql
-- Descripción:
--   1. Agrega la columna google_reviews JSONB a la tabla business_settings
--      para almacenar la configuración, métricas y caché de reseñas por cliente.
--   2. Registra la feature flag 'google_reviews' apagada por defecto (false)
--      en el objeto business_settings.features de cada cliente.
-- ==============================================================================

-- 1. Columna de datos y caché de reseñas
ALTER TABLE public.business_settings 
ADD COLUMN IF NOT EXISTS google_reviews JSONB NOT NULL DEFAULT '{
    "enabled": false,
    "place_id": "",
    "rating": 5.0,
    "user_ratings_total": 0,
    "write_review_url": "",
    "show_in_hero": true,
    "show_in_home": true,
    "show_in_about": true,
    "last_synced_at": null,
    "reviews": []
}'::jsonb;

-- 2. Registrar la Feature Flag en business_settings.features (nace apagada en false)
UPDATE public.business_settings
SET features = COALESCE(features, '{}'::jsonb) || '{"google_reviews": false}'::jsonb
WHERE NOT (COALESCE(features, '{}'::jsonb) ? 'google_reviews');
