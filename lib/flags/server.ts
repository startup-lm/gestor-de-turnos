import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { isFeatureEnabled, FeatureFlagName, DEFAULT_FEATURES } from "./index";

/**
 * Evalúa si una feature flag está habilitada desde un contexto de servidor (API routes, server actions).
 * Lee de business_settings en Supabase usando supabaseAdmin.
 */
export async function isServerFeatureEnabled(flag: FeatureFlagName): Promise<boolean> {
  try {
    const { data } = await supabaseAdmin
      .from("business_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    return isFeatureEnabled(flag, data?.features, data?.plan);
  } catch (error) {
    console.error(`Error al verificar flag '${flag}' en servidor:`, error);
    return DEFAULT_FEATURES[flag] ?? false;
  }
}
