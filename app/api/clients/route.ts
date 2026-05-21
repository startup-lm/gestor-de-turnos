import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/response";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { revalidateTag } from "next/cache";
import { ClientUpsertSchema } from "@/lib/schemas";
import { requireBarberOrAdmin } from "@/lib/api/auth";

// GET /api/clients?search=<query>
// Si query es numérico → busca por phone (starts with)
// Si query es texto    → busca por name (ilike %query%)
// Retorna máx 5 resultados. Usado por el autocomplete del barbero.
export async function GET(request: Request) {
  const staff = await requireBarberOrAdmin();
  if (!staff) return errorResponse("No autorizado", 401);

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";

  if (!search || search.length < 2) {
    return NextResponse.json([]);
  }

  const isNumeric = /^\d+$/.test(search);

  let query = supabaseAdmin
    .from("clients")
    .select("id, name, phone")
    .limit(5)
    .order("name", { ascending: true });

  if (isNumeric) {
    query = query.ilike("phone", `${search}%`);
  } else {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, error } = await query;
  if (error) return errorResponse(error.message);
  return NextResponse.json(data ?? []);
}

// POST /api/clients
// Upsert por teléfono: si ya existe → actualiza last_visit_date (sin pisar el nombre original)
//                      si no existe  → crea el cliente nuevo
export async function POST(request: Request) {
  const staff = await requireBarberOrAdmin();
  if (!staff) return errorResponse("No autorizado", 401);

  const body = await request.json();
  const parsed = ClientUpsertSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message, 400);
  }

  const { name, phone } = parsed.data;

  const today = new Date().toISOString().split("T")[0];

  // Buscar si ya existe por teléfono
  const { data: existing } = await supabaseAdmin
    .from("clients")
    .select("*")
    .eq("phone", phone)
    .maybeSingle();

  if (existing) {
    // Preservar el nombre original, solo actualizar last_visit_date
    const { data, error } = await supabaseAdmin
      .from("clients")
      .update({ last_visit_date: today })
      .eq("phone", phone)
      .select()
      .single();
    if (error) return errorResponse(error.message);
    revalidateTag("clients");
    return NextResponse.json(data);
  }

  // Crear cliente nuevo
  const { data, error } = await supabaseAdmin
    .from("clients")
    .insert({ name, phone, last_visit_date: today })
    .select()
    .single();
  if (error) return errorResponse(error.message);
  revalidateTag("clients");
  return NextResponse.json(data);
}
