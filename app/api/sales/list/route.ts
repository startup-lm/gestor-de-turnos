import { NextResponse } from "next/server";
import { errorResponse, dbErrorResponse } from "@/lib/api/response";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { requireBarberOrAdmin } from "@/lib/api/auth";
import { createdAtBound } from "@/lib/dates/argentina";

export async function GET(request: Request) {
  const staff = await requireBarberOrAdmin();
  if (!staff) return errorResponse("No autorizado", 401);

  const { searchParams } = new URL(request.url);
  const pageParam = searchParams.get("page");
  const pageSizeParam = searchParams.get("pageSize");
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");

  let query = supabaseAdmin
    .from("sales")
    .select(
      "id, created_at, price, quantity, total, details, payment_method, barber_id, product_id, arca_invoice_id, barbers(name), products(name)",
      { count: "exact" }
    );

  if (startDate) {
    query = query.gte("created_at", createdAtBound(startDate, "start"));
  }
  if (endDate) {
    query = query.lte("created_at", createdAtBound(endDate, "end"));
  }

  query = query.order("created_at", { ascending: false });

  if (pageParam && pageSizeParam) {
    const page = Number(pageParam);
    const pageSize = Number(pageSizeParam);
    const safePage = Number.isNaN(page) || page < 1 ? 1 : page;
    const safePageSize = Number.isNaN(pageSize) || pageSize < 1 ? 10 : Math.min(pageSize, 500);
    const from = (safePage - 1) * safePageSize;
    const to = from + safePageSize - 1;
    query = query.range(from, to);
  }

  const { data, error, count } = await query;

  if (error) return dbErrorResponse(error, "sales/list");

  return NextResponse.json({
    data: data ?? [],
    total: count ?? (data?.length ?? 0),
  });
}
