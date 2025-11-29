import { NextResponse }    from "next/server";
import { errorResponse }   from "@/lib/api/response";
import { supabaseAdmin }   from "@/lib/supabase/supabaseAdmin";

interface RawRow {
  barber_id: number;
  total:     number | null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start_date");
  const end   = searchParams.get("end_date");

  if (!start || !end) return errorResponse("start_date y end_date son requeridos", 400);

  const { data, error } = await supabaseAdmin
    .from("sales")
    .select("barber_id, total")
    .gte("created_at", start)
    .lte("created_at", end);

  if (error) return errorResponse(error.message);

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