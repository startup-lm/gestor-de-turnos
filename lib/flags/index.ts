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
 * Planes comerciales. Cada plan define qué features incluye.
 * Una feature nueva no se agrega a ningún plan hasta que se decida venderla.
 */
export type PlanName = "basic" | "pro";

export const DEFAULT_PLAN: PlanName = "basic";

export const PLAN_FEATURES: Record<PlanName, Record<string, boolean>> = {
  basic: {},
  pro: {
    arca: true,
    cash_management: true,
    google_reviews: true,
  },
};

export function isPlanName(value: unknown): value is PlanName {
  return typeof value === "string" && value in PLAN_FEATURES;
}

/**
 * Evalúa si una feature flag está habilitada para el cliente actual.
 * Función pura y segura para ejecutar en navegador y cliente.
 *
 * Orden de prioridad (todo vive en business_settings de cada cliente):
 * 1. `features[flag]`: override puntual (ej. regalar una feature a un cliente basic).
 * 2. `plan`: lo que incluye el plan contratado.
 * 3. `DEFAULT_FEATURES`: apagado.
 *
 * Solo el dueño del SaaS modifica `plan` y `features`, directo en la base:
 * la API de configuración del local los ignora.
 */
export function isFeatureEnabled(
  flag: FeatureFlagName,
  features?: Record<string, boolean> | null,
  plan?: string | null
): boolean {
  if (features && typeof features[flag] === "boolean") {
    return features[flag];
  }
  const planName = isPlanName(plan) ? plan : DEFAULT_PLAN;
  if (typeof PLAN_FEATURES[planName][flag] === "boolean") {
    return PLAN_FEATURES[planName][flag];
  }
  return DEFAULT_FEATURES[flag] ?? false;
}
