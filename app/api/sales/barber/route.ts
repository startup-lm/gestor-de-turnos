import { NextResponse } from "next/server";
import { errorResponse, dbErrorResponse } from "@/lib/api/response";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { requireBarberOrAdmin } from "@/lib/api/auth";
import { isAdminStaff } from "@/lib/api/ownership";
import { dateColumnBound } from "@/lib/dates/argentina";
import { fetchAllRows } from "@/lib/supabase/fetchAllRows";

export async function GET(request: Request) {
  const staff = await requireBarberOrAdmin();
  if (!staff) return errorResponse("No autorizado", 401);

  const { searchParams } = new URL(request.url);
  const barberId = searchParams.get("barber_id");
  const start    = searchParams.get("start_date");
  const end      = searchParams.get("end_date");

  if (barberId === null || barberId === undefined || !start || !end) {
    return errorResponse("barber_id, start_date y end_date son requeridos", 400);
  }

  const startIso = dateColumnBound(start);
  const endIso = dateColumnBound(end);

  // Un barbero solo recibe sus propias ventas, pida el barber_id que pida
  const numBarberId = isAdminStaff(staff) ? Number(barberId) : staff.barber.id;

  const { data, error } = await fetchAllRows((from, to) => {
    let query = supabaseAdmin
      .from("sales")
      .select("id, total, created_at, barber_id")
      .gte("created_at", startIso)
      .lte("created_at", endIso);
    if (numBarberId !== 0) query = query.eq("barber_id", numBarberId);
    return query.order("created_at", { ascending: true }).order("id", { ascending: true }).range(from, to);
  });

  if (error) return dbErrorResponse(error, "sales/barber");

  // devolvemos las filas crudas, el front se encarga de agrupar por día/semana/mes
  return NextResponse.json(data);
}
