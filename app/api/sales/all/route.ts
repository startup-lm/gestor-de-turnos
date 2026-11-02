import { NextResponse }    from "next/server";
import { errorResponse, dbErrorResponse } from "@/lib/api/response";
import { supabaseAdmin }   from "@/lib/supabase/supabaseAdmin";
import { requireBarberOrAdmin } from "@/lib/api/auth";

interface RawRow {
  barber_id: number;
  total:     number | null;
}

export async function GET(request: Request) {
  const staff = await requireBarberOrAdmin();
  if (!staff) return errorResponse("No autorizado", 401);

  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start_date");
  const end   = searchParams.get("end_date");

  if (!start || !end) return errorResponse("start_date y end_date son requeridos", 400);

  const startIso = start.includes("T") ? start : `${start}T00:00:00.000Z`;
  const endIso = end.includes("T") ? end : `${end}T23:59:59.999Z`;

  const { data, error } = await supabaseAdmin
    .from("sales")
    .select("barber_id, total")
    .gte("created_at", startIso)
    .lte("created_at", endIso);

  if (error) return dbErrorResponse(error, "sales/all");

  const rows = (data ?? []) as RawRow[];

  const agg: Record< number, { totalSales: number; totalSalesRevenue: number } > = {};

  rows.forEach(({ barber_id, total }) => {
    if (!agg[barber_id]) agg[barber_id] = {  totalSales: 0, totalSalesRevenue: 0 };
    agg[barber_id].totalSales++;
    agg[barber_id].totalSalesRevenue += total ?? 0;
  });

  const result = Object.entries(agg).map(
    ([barberId, { totalSales, totalSalesRevenue }]) => ({
      barberId:      Number(barberId),
      totalSales,
      totalSalesRevenue,
    })
  );

  return NextResponse.json(result);
}