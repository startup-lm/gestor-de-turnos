import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { errorResponse, dbErrorResponse } from "@/lib/api/response";
import { requireBarberOrAdmin } from "@/lib/api/auth";
import { certificateExpiry } from "@/lib/arca/wsaa";

export const runtime = "nodejs";
export const maxDuration = 60;

const DEFAULT_STATUS = {
  environment: "homo",
  ready: false,
  cuit: null,
  point_of_sale: null,
  has_cert: false,
  has_key: false,
  cert_expires_at: null,
  wsaa_url: null,
  wsfe_url: null,
};

export async function GET() {
  const staff = await requireBarberOrAdmin();
  if (!staff) return errorResponse("No autorizado", 401);

  const { data, error } = await supabaseAdmin
    .from("arca_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) return dbErrorResponse(error, "arca/status");
  if (!data) return NextResponse.json(DEFAULT_STATUS);

  const hasCert = !!data.cert_pem;
  const hasKey = !!data.key_pem;
  // Las URLs no son obligatorias: si están vacías se usan las oficiales de ARCA
  const ready = !!data.cuit && !!data.point_of_sale && hasCert && hasKey;
  const expiry = data.cert_pem ? certificateExpiry(data.cert_pem) : null;

  return NextResponse.json({
    environment: data.environment,
    ready,
    cuit: data.cuit ?? null,
    point_of_sale: data.point_of_sale ?? null,
    has_cert: hasCert,
    has_key: hasKey,
    cert_expires_at: expiry ? expiry.toISOString() : null,
    wsaa_url: data.wsaa_url ?? null,
    wsfe_url: data.wsfe_url ?? null,
  });
}
