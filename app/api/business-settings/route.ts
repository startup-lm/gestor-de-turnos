import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { requireAdmin } from "@/lib/api/auth";
import { errorResponse, dbErrorResponse } from "@/lib/api/response";
import { toEditableSettingsPayload, toPublicBusinessSettings } from "@/lib/settings/sanitize";

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

  const payload = await req.json();
  const { data, error } = await supabaseAdmin
    .from("business_settings")
    .upsert({ id: 1, ...toEditableSettingsPayload(payload) })
    .select("*")
    .single();
  if (error) return dbErrorResponse(error, "business-settings.put");
  revalidateTag("business-settings");
  return NextResponse.json(toPublicBusinessSettings(data));
}
