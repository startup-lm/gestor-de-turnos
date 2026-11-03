import { NextResponse }    from "next/server";
import { errorResponse, dbErrorResponse } from "@/lib/api/response";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { requireBarberOrAdmin } from "@/lib/api/auth";
import { isAdminStaff } from "@/lib/api/ownership";

interface RawRow {
  barber_id: number;
  price:     number | null;
  payment_method: string | null;
}

export async function GET(request: Request) {
  const staff = await requireBarberOrAdmin();
  if (!staff) return errorResponse("No autorizado", 401);

  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start_date");
  const end   = searchParams.get("end_date");

  if (!start || !end) return errorResponse("start_date y end_date son requeridos", 400);

  let query = supabaseAdmin
    .from("appointments")
    .select("barber_id, price, payment_method")
    .is("deleted_at", null)
    .gte("date", start)
    .lte("date", end)
    .neq("phone", "0000000000");
  // La facturación del local es del admin: un barbero solo recibe la suya
  if (!isAdminStaff(staff)) query = query.eq("barber_id", staff.barber.id);

  const { data, error } = await query;

  if (error) return dbErrorResponse(error, "appointments/all");

  const rows = (data ?? []) as RawRow[];

  const agg: Record< number, { totalAppt: number; totalRevenue: number } > = {};
  const paymentMethodTotals: Record<string, number> = {};

  rows.forEach(({ barber_id, price, payment_method }) => {
    if (!agg[barber_id]) agg[barber_id] = {  totalAppt: 0, totalRevenue: 0 };
    agg[barber_id].totalAppt++;
    agg[barber_id].totalRevenue += price ?? 0;
    
    if (price) {
      let method = payment_method?.trim() || "Otros";
      if (method === "MercadoPago") method = "Mercado Pago";
      paymentMethodTotals[method] = (paymentMethodTotals[method] || 0) + price;
    }
  });

  const barberTotals = Object.entries(agg).map(
    ([barberId, { totalAppt, totalRevenue }]) => ({
      barberId:      Number(barberId),
      totalAppt,
      totalRevenue,
    })
  );

  return NextResponse.json({ barberTotals, paymentMethodTotals });
}
