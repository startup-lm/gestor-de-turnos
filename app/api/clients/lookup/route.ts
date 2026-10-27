import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { normalizePhone } from "@/utils/phone";
import { rateLimit } from "@/lib/api/rateLimit";

// GET /api/clients/lookup?phone=<phone>
// Permite a usuarios anónimos en la pantalla de reserva reconocer su nombre si ya son clientes habituales.
// Solo busca por coincidencia exacta de teléfono normalizado y no expone listados.
export async function GET(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  const limitResult = rateLimit(`lookup-client-${ip}`, 20, 60000);
  if (!limitResult.success) {
    return NextResponse.json({ found: false });
  }

  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone") ?? "";

  const normalized = normalizePhone(phone);
  if (!normalized.isValid || normalized.national.length < 10) {
    return NextResponse.json({ found: false });
  }

  const { data } = await supabaseAdmin
    .from("clients")
    .select("name")
    .eq("phone", normalized.e164)
    .maybeSingle();

  if (!data?.name) {
    return NextResponse.json({ found: false });
  }

  const firstName = data.name.trim().split(" ")[0];

  return NextResponse.json({
    found: true,
    name: data.name,
    firstName,
  });
}
