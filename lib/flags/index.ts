export type FeatureFlagName = "arca" | "cash_management" | (string & {});

/**
 * Defaults de Feature Flags en código.
 * Regla: Toda feature nueva sale con el default apagado (false).
 */
export const DEFAULT_FEATURES: Record<string, boolean> = {
  arca: false,
  cash_management: false,
};

/**
 * Evalúa si una feature flag está habilitada para el cliente actual.
 * Función pura y segura para ejecutar en navegador y cliente.
 *
 * Jerarquía de resolución:
 * 1. Valor explícito en base de datos del cliente (`features[flag]`).
 * 2. Default definido en código (`DEFAULT_FEATURES[flag]`).
 * 3. Fallback seguro: `false`.
 */
export function isFeatureEnabled(
  flag: FeatureFlagName,
  features?: Record<string, boolean> | null
): boolean {
  // 1. Valor explícito en base de datos del cliente (activado por el administrador del SaaS)
  if (features && typeof features[flag] === "boolean") {
    return features[flag];
  }

  // 2. Activación por Variable de Entorno (Vercel / .env.local por deploy de cliente)
  if (flag === "cash_management") {
    const envVal = process.env.NEXT_PUBLIC_ENABLE_CASH_MANAGEMENT;
    if (envVal === "true") return true;
    if (envVal === "false") return false;
  }

  if (flag === "arca") {
    const envVal = process.env.NEXT_PUBLIC_ENABLE_ARCA;
    if (envVal === "true") return true;
    if (envVal === "false") return false;
  }

  // 3. Default en código (apagado por defecto)
  return DEFAULT_FEATURES[flag] ?? false;
}
