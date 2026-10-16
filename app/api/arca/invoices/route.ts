import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { errorResponse } from "@/lib/api/response";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);
  const sourceType = searchParams.get("source_type");
  const status = searchParams.get("status");
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");

  let query = supabaseAdmin
    .from("arca_invoices")
    .select(
      "id, created_at, status, total, customer_name, cae, cae_due_date, voucher_number, voucher_type, point_of_sale, source_type, source_id, doc_type, doc_number, invoice_type"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (sourceType) query = query.eq("source_type", sourceType);
  if (status) query = query.eq("status", status);
  if (dateFrom) query = query.gte("created_at", dateFrom);
  if (dateTo) query = query.lte("created_at", dateTo);

  const { data, error } = await query;

  if (error) return errorResponse(`ARCA: ${error.message}`);
  return NextResponse.json(data ?? []);
}
