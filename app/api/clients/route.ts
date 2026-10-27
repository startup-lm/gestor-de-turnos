import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/response";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { revalidateTag } from "next/cache";
import { ClientUpsertSchema } from "@/lib/schemas";
import { requireBarberOrAdmin } from "@/lib/api/auth";
import { normalizePhone } from "@/utils/phone";

// GET /api/clients?search=<query>
// Búsqueda inteligente por nombre (texto) o por teléfono (numérico / E.164 / local)
// Retorna máx 10 resultados. Usado por el autocomplete del barbero.
export async function GET(request: Request) {
  const staff = await requireBarberOrAdmin();
  if (!staff) return errorResponse("No autorizado", 401);

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";

  if (!search || search.length < 2) {
    return NextResponse.json([]);
  }

  const cleanDigits = search.replace(/\D/g, "");
  const normalized = normalizePhone(search);
  const hasDigits = cleanDigits.length >= 3;

  let query = supabaseAdmin
    .from("clients")
    .select("id, name, phone")
    .limit(10)
    .order("name", { ascending: true });

  if (hasDigits) {
    const nationalQuery = normalized.isValid ? normalized.national : cleanDigits;
    const e164Query = normalized.isValid ? normalized.e164 : "";

    const orFilters = [
      `phone.ilike.%${cleanDigits}%`,
      `phone.ilike.%${nationalQuery}%`,
      e164Query ? `phone.ilike.%${e164Query}%` : null,
      `name.ilike.%${search}%`,
    ]
      .filter(Boolean)
      .join(",");

    query = query.or(orFilters);
  } else {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, error } = await query;
  if (error) return errorResponse(error.message);
  return NextResponse.json(data ?? []);
}

// POST /api/clients
// Upsert por teléfono normalizado: si ya existe → actualiza last_visit_date (sin pisar el nombre original)
//                                  si no existe  → crea el cliente nuevo con formato canónico (+549...)
export async function POST(request: Request) {
  const staff = await requireBarberOrAdmin();
  if (!staff) return errorResponse("No autorizado", 401);

  const body = await request.json();
  const parsed = ClientUpsertSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message, 400);
  }

  const { name, phone } = parsed.data;
  const normalized = normalizePhone(phone);
  const canonicalPhone = normalized.isValid ? normalized.e164 : phone;

  const today = new Date().toISOString().split("T")[0];

  // Buscar si ya existe por teléfono canónico o nacional
  const { data: existing } = await supabaseAdmin
    .from("clients")
    .select("*")
    .or(`phone.eq.${canonicalPhone},phone.eq.${normalized.national}`)
    .maybeSingle();

  if (existing) {
    // Preservar el nombre original, actualizar last_visit_date y normalizar teléfono a canónico
    const { data, error } = await supabaseAdmin
      .from("clients")
      .update({ last_visit_date: today, phone: canonicalPhone })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) return errorResponse(error.message);
    revalidateTag("clients");
    return NextResponse.json(data);
  }

  // Crear cliente nuevo
  const { data, error } = await supabaseAdmin
    .from("clients")
    .insert({ name, phone: canonicalPhone, last_visit_date: today })
    .select()
    .single();
  if (error) return errorResponse(error.message);
  revalidateTag("clients");
  return NextResponse.json(data);
}
