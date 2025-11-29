import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/response";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const barberId = searchParams.get("barber_id");
  const start    = searchParams.get("start_date");
  const end      = searchParams.get("end_date");

  if (!barberId || !start || !end) {
    return errorResponse("barber_id, start_date y end_date son requeridos", 400);
  }

  const { data, error } = await supabaseAdmin
    .from("sales")
    .select("id, total, created_at")
    .eq("barber_id", Number(barberId))
    .gte("created_at", start)
    .lte("created_at", end)
    .order("created_at", { ascending: true });

  if (error) return errorResponse(error.message);

  // devolvemos las filas crudas, el front se encarga de agrupar por día/semana/mes
  return NextResponse.json(data ?? []);
}
