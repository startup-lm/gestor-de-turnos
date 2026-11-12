import { errorResponse, dbErrorResponse } from "@/lib/api/response";
import { parseBody } from "@/lib/api/parseBody";
import { BusinessHoursUpdateSchema } from "@/lib/schemas";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { requireAdmin } from "@/lib/api/auth";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("business_hours_global")
    .select("open_time, close_time, lunch_start, lunch_end, closed_days")
    .eq("id", 1)
    .single();

  if (error || !data) return dbErrorResponse(error, "business-hours");
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("No autorizado", 401);

  const { data: body, error: bodyError } = await parseBody(req, BusinessHoursUpdateSchema);
  if (bodyError) return bodyError;

  const { data, error } = await supabaseAdmin
    .from("business_hours_global")
    .upsert({ id: 1, ...body })
    .select("open_time, close_time, lunch_start, lunch_end, closed_days")
    .single();

  if (error) return dbErrorResponse(error, "business-hours");
  revalidateTag("business-hours");
  return NextResponse.json(data);
}
