// app/api/sales/list/route.ts
import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/response";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageParam = searchParams.get("page");
  const pageSizeParam = searchParams.get("pageSize");
  const page = Number(pageParam ?? "1");
  const pageSize = Number(pageSizeParam ?? "10");
  const safePage = Number.isNaN(page) || page < 1 ? 1 : page;
  const safePageSize = Number.isNaN(pageSize) || pageSize < 1 ? 10 : Math.min(pageSize, 100);
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;
  
  const { data, error, count } = await supabaseAdmin
    .from("sales")
    .select(
      "id, created_at, price, quantity, total, details, barber_id, product_id, barbers(name), products(name)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) return errorResponse(error.message);

  return NextResponse.json({
    data: data ?? [],
    total: count ?? 0,
    page: safePage,
    pageSize: safePageSize,
  });
}
