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
 *
 * Jerarquía de resolución:
 * 1. Valor explícito en base de datos del cliente (`features[flag]`).
 * 2. Default definido en código (`DEFAULT_FEATURES[flag]`).
 * 3. Fallback seguro: `false`.
 */
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

export function isFeatureEnabled(
  flag: FeatureFlagName,
  features?: Record<string, boolean> | null
): boolean {
  if (features && typeof features[flag] === "boolean") {
    return features[flag];
  }
  return DEFAULT_FEATURES[flag] ?? false;
}

/**
 * Evalúa si una feature flag está habilitada desde un contexto de servidor (API routes, server actions).
 */
export async function isServerFeatureEnabled(flag: FeatureFlagName): Promise<boolean> {
  try {
    const { data } = await supabaseAdmin
      .from("business_settings")
      .select("features")
      .eq("id", 1)
      .maybeSingle();

    return isFeatureEnabled(flag, data?.features);
  } catch (error) {
    console.error(`Error al verificar flag '${flag}' en servidor:`, error);
    return DEFAULT_FEATURES[flag] ?? false;
  }
}
