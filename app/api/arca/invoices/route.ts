import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { errorResponse, dbErrorResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/api/auth";
import { createdAtBound } from "@/lib/dates/argentina";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("No autorizado", 401);

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);
  const sourceType = searchParams.get("source_type");
  const status = searchParams.get("status");
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");
  const environment = searchParams.get("environment");

  let query = supabaseAdmin
    .from("arca_invoices")
    .select(
      "id, created_at, status, total, customer_name, cae, cae_due_date, voucher_number, voucher_type, point_of_sale, source_type, source_id, doc_type, doc_number, invoice_type, receiver_iva_condition, error_message, environment"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (environment) query = query.eq("environment", environment);
  if (sourceType) query = query.eq("source_type", sourceType);
  if (status) query = query.eq("status", status);
  if (dateFrom) query = query.gte("created_at", createdAtBound(dateFrom, "start"));
  if (dateTo) query = query.lte("created_at", createdAtBound(dateTo, "end"));

  const { data, error } = await query;

  if (error) return dbErrorResponse(error, "arca/invoices");
  return NextResponse.json(data ?? []);
}
