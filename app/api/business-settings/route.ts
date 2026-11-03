import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { requireAdmin } from "@/lib/api/auth";
import { errorResponse, dbErrorResponse } from "@/lib/api/response";
import { toEditableSettingsPayload, toPublicBusinessSettings } from "@/lib/settings/sanitize";
import { getServerPlanContext } from "@/lib/flags/server";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("business_settings")
    .select("*")
    .eq("id", 1)
    .single();
  if (error) return dbErrorResponse(error, "business-settings.get");
  return NextResponse.json(toPublicBusinessSettings(data));
}

export async function PUT(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("No autorizado", 401);

  const payload = toEditableSettingsPayload(await req.json());

  // Límites del plan: lo que el plan no permite configurar no se guarda
  const { isEnabled, limits } = await getServerPlanContext();
  if (Array.isArray(payload.payment_methods)) {
    if (!isEnabled("custom_payment_methods") || limits.maxPaymentMethods === 0) {
      delete payload.payment_methods;
    } else if (payload.payment_methods.length > limits.maxPaymentMethods) {
      return errorResponse(`Tu plan permite hasta ${limits.maxPaymentMethods} medios de cobro`, 403);
    }
  }
  if (!isEnabled("booking_rules")) delete payload.assignment_criteria;

  const { data, error } = await supabaseAdmin
    .from("business_settings")
    .upsert({ id: 1, ...payload })
    .select("*")
    .single();
  if (error) return dbErrorResponse(error, "business-settings.put");
  revalidateTag("business-settings");
  return NextResponse.json(toPublicBusinessSettings(data));
}
