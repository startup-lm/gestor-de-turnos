import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/response";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const barberId = searchParams.get("barber_id");
  const start    = searchParams.get("start_date");
  const end      = searchParams.get("end_date");

  if (barberId === null || barberId === undefined || !start || !end) {
    return errorResponse("barber_id, start_date y end_date son requeridos", 400);
  }

  const startIso = start.includes("T") ? start : `${start}T00:00:00.000Z`;
  const endIso = end.includes("T") ? end : `${end}T23:59:59.999Z`;

  let query = supabaseAdmin
    .from("sales")
    .select("id, total, created_at, barber_id")
    .gte("created_at", startIso)
    .lte("created_at", endIso);

  const numBarberId = Number(barberId);
  if (numBarberId !== 0) {
    query = query.eq("barber_id", numBarberId);
  }

  const { data, error } = await query.order("created_at", { ascending: true });

  if (error) return errorResponse(error.message);

  // devolvemos las filas crudas, el front se encarga de agrupar por día/semana/mes
  return NextResponse.json(data ?? []);
}
