export type FeatureFlagName = "arca" | "cash_management" | "google_reviews" | (string & {});

/**
 * Defaults de Feature Flags en código.
 * Regla: Toda feature nueva sale con el default apagado (false).
 */
export const DEFAULT_FEATURES: Record<string, boolean> = {
  arca: false,
  cash_management: false,
  google_reviews: false,
};

/**
 * Evalúa si una feature flag está habilitada para el cliente actual.
 * Función pura y segura para ejecutar en navegador y cliente.
 * 
 * Regla de Oro SaaS: La base de datos (business_settings.features) es la ÚNICA
 * fuente de verdad. El dueño del SaaS activa o desactiva features por plan
 * directamente en la base de datos de cada cliente.
 */
export function isFeatureEnabled(
  flag: FeatureFlagName,
  features?: Record<string, boolean> | null
): boolean {
  if (features && typeof features[flag] === "boolean") {
    return features[flag];
  }
  return DEFAULT_FEATURES[flag] ?? false;
}
