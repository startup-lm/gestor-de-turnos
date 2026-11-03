import { NextResponse }    from "next/server";
import { errorResponse, dbErrorResponse } from "@/lib/api/response";
import { supabaseAdmin }   from "@/lib/supabase/supabaseAdmin";
import { requireBarberOrAdmin } from "@/lib/api/auth";
import { isAdminStaff } from "@/lib/api/ownership";
import { createdAtBound } from "@/lib/dates/argentina";
import { fetchAllRows } from "@/lib/supabase/fetchAllRows";
import { commissionOf } from "@/lib/finance/commission";
import { getAllBarberRates } from "@/lib/finance/barberRates";

interface RawRow {
  barber_id: number;
  total:     number | null;
  commission_rate: number | null;
}

export async function GET(request: Request) {
  const staff = await requireBarberOrAdmin();
  if (!staff) return errorResponse("No autorizado", 401);

  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start_date");
  const end   = searchParams.get("end_date");

  if (!start || !end) return errorResponse("start_date y end_date son requeridos", 400);

  const startIso = createdAtBound(start, "start");
  const endIso = createdAtBound(end, "end");

  const { data: rows, error } = await fetchAllRows<RawRow>((from, to) => {
    let query = supabaseAdmin
      .from("sales")
      .select("barber_id, total, commission_rate")
      .gte("created_at", startIso)
      .lte("created_at", endIso);
    // Un barbero solo recibe sus propias ventas
    if (!isAdminStaff(staff)) query = query.eq("barber_id", staff.barber.id);
    return query.order("id", { ascending: true }).range(from, to);
  });

  if (error) return dbErrorResponse(error, "sales/all");

  const { rates, error: ratesError } = await getAllBarberRates();
  if (ratesError) return dbErrorResponse(ratesError, "sales/all");

  const agg: Record< number, { totalSales: number; totalSalesRevenue: number; totalSalesCommission: number } > = {};

  rows.forEach(({ barber_id, total, commission_rate }) => {
    if (!agg[barber_id]) agg[barber_id] = {  totalSales: 0, totalSalesRevenue: 0, totalSalesCommission: 0 };
    agg[barber_id].totalSales++;
    agg[barber_id].totalSalesRevenue += total ?? 0;
    // Con el % congelado al vender: cambiar el % del barbero no recalcula lo viejo
    agg[barber_id].totalSalesCommission += commissionOf(total, commission_rate, rates.get(barber_id)?.saleCommission ?? 0);
  });

  const result = Object.entries(agg).map(
    ([barberId, { totalSales, totalSalesRevenue, totalSalesCommission }]) => ({
      barberId:      Number(barberId),
      totalSales,
      totalSalesRevenue,
      totalSalesCommission,
    })
  );

  return NextResponse.json(result);
}