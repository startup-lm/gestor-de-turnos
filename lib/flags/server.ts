import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { errorResponse, dbErrorResponse } from "@/lib/api/response";
import {
  isFeatureEnabled,
  getPlanLimits,
  resolvePlan,
  FeatureFlagName,
  PlanLimits,
  PlanName,
} from "./index";

export const PLAN_FORBIDDEN_MESSAGE = "Tu plan no incluye esta función";
export const BARBER_LIMIT_MESSAGE = "Alcanzaste el límite de profesionales de tu plan";

export interface ServerPlanContext {
  plan: PlanName;
  limits: PlanLimits;
  isEnabled: (flag: FeatureFlagName) => boolean;
}

/**
 * Lee plan y overrides del cliente una sola vez (API routes, server actions).
 * Si la lectura falla, se asume el plan por defecto: nunca se habilita de más.
 */
export async function getServerPlanContext(): Promise<ServerPlanContext> {
  let features: Record<string, boolean> | null = null;
  let plan: string | null = null;
  try {
    const { data } = await supabaseAdmin
      .from("business_settings")
      .select("plan, features")
      .eq("id", 1)
      .maybeSingle();
    features = data?.features ?? null;
    plan = data?.plan ?? null;
  } catch (error) {
    console.error("Error al leer el plan del cliente:", error);
  }
  return {
    plan: resolvePlan(plan),
    limits: getPlanLimits(plan),
    isEnabled: (flag) => isFeatureEnabled(flag, features, plan),
  };
}

export async function isServerFeatureEnabled(flag: FeatureFlagName): Promise<boolean> {
  const ctx = await getServerPlanContext();
  return ctx.isEnabled(flag);
}

/** Devuelve un 403 si el plan no incluye la feature; null si está habilitada. */
export async function requirePlanFeature(flag: FeatureFlagName) {
  if (await isServerFeatureEnabled(flag)) return null;
  return errorResponse(PLAN_FORBIDDEN_MESSAGE, 403);
}

/**
 * Valida que el plan permita dar de alta profesionales y que no se haya llegado al límite.
 * Devuelve la respuesta de error, o null si se puede crear uno más.
 */
export async function checkBarberLimit() {
  const { isEnabled, limits } = await getServerPlanContext();
  if (!isEnabled("staff_management")) return errorResponse(PLAN_FORBIDDEN_MESSAGE, 403);
  if (!Number.isFinite(limits.maxBarbers)) return null;

  const { count, error } = await supabaseAdmin
    .from("barbers")
    .select("id", { count: "exact", head: true });
  if (error) return dbErrorResponse(error, "barbers.limit");
  if ((count ?? 0) >= limits.maxBarbers) return errorResponse(BARBER_LIMIT_MESSAGE, 403);
  return null;
}
