export type FeatureFlagName = "arca" | (string & {});

/**
 * Defaults de Feature Flags en código.
 * Regla: Toda feature nueva sale con el default apagado (false).
 */
export const DEFAULT_FEATURES: Record<string, boolean> = {
  arca: false,
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
  if (features && typeof features[flag] === "boolean") {
    return features[flag];
  }
  return DEFAULT_FEATURES[flag] ?? false;
}
