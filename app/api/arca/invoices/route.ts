import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { errorResponse } from "@/lib/api/response";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);

  const { data, error } = await supabaseAdmin
    .from("arca_invoices")
    .select(
      "id, created_at, status, total, customer_name, cae, cae_due_date, voucher_number, voucher_type, point_of_sale"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return errorResponse(`ARCA: ${error.message}`);
  return NextResponse.json(data ?? []);
}
