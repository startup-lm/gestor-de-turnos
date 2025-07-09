import { NextResponse }    from "next/server";
import { errorResponse }   from "@/lib/api/response";
import { supabaseAdmin }   from "@/lib/supabase/supabaseAdmin";

interface RawRow {
  barber_id: number;
  price:     number | null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start_date");
  const end   = searchParams.get("end_date");

  if (!start || !end) return errorResponse("start_date y end_date son requeridos", 400);

  const { data, error } = await supabaseAdmin
    .from("appointments")
    .select("barber_id, price")
    .gte("date", start)
    .lte("date", end)
    .neq("phone", "0000000000");

  if (error) return errorResponse(error.message);

  const rows = (data ?? []) as RawRow[];

  const agg: Record< number, { totalAppt: number; totalRevenue: number } > = {};

  rows.forEach(({ barber_id, price }) => {
    if (!agg[barber_id]) agg[barber_id] = {  totalAppt: 0, totalRevenue: 0 };
    agg[barber_id].totalAppt++;
    agg[barber_id].totalRevenue += price ?? 0;
  });

  const result = Object.entries(agg).map(
    ([barberId, { totalAppt, totalRevenue }]) => ({
      barberId:      Number(barberId),
      totalAppt,
      totalRevenue,
    })
  );

  return NextResponse.json(result);
}
