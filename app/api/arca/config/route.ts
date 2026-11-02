import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { errorResponse, dbErrorResponse } from "@/lib/api/response";
import { isServerFeatureEnabled } from "@/lib/flags/server";
import { requireAdmin } from "@/lib/api/auth";

const DEFAULT_CONFIG = {
  environment: "mock",
  cuit: null,
  point_of_sale: null,
  wsaa_url: null,
  wsfe_url: null,
  has_cert: false,
  has_key: false,
  has_passphrase: false,
};

function sanitize(data: Record<string, unknown>) {
  const { cert_pem, key_pem, key_passphrase, ...rest } = data as {
    cert_pem?: string | null;
    key_pem?: string | null;
    key_passphrase?: string | null;
  };
  return {
    ...rest,
    has_cert: !!cert_pem,
    has_key: !!key_pem,
    has_passphrase: !!key_passphrase,
  };
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("No autorizado", 401);

  const enabled = await isServerFeatureEnabled("arca");
  if (!enabled) return errorResponse("Not Found", 404);

  const { data, error } = await supabaseAdmin
    .from("arca_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) return dbErrorResponse(error, "arca/config");
  if (!data) return NextResponse.json(DEFAULT_CONFIG);
  return NextResponse.json(sanitize(data));
}

export async function PUT(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("No autorizado", 401);

  const enabled = await isServerFeatureEnabled("arca");
  if (!enabled) return errorResponse("Not Found", 404);

  const payload = await req.json();
  const update: Record<string, unknown> = {
    id: 1,
    updated_at: new Date().toISOString(),
  };

  if ("environment" in payload) update.environment = payload.environment;
  if ("cuit" in payload) update.cuit = payload.cuit;
  if ("pointOfSale" in payload) update.point_of_sale = payload.pointOfSale;
  if ("wsaaUrl" in payload) update.wsaa_url = payload.wsaaUrl;
  if ("wsfeUrl" in payload) update.wsfe_url = payload.wsfeUrl;
  if ("certPem" in payload && payload.certPem) update.cert_pem = payload.certPem;
  if ("keyPem" in payload && payload.keyPem) update.key_pem = payload.keyPem;
  if ("keyPassphrase" in payload) update.key_passphrase = payload.keyPassphrase || null;

  const { data, error } = await supabaseAdmin
    .from("arca_settings")
    .upsert(update)
    .select("*")
    .single();

  if (error) return dbErrorResponse(error, "arca/config");
  return NextResponse.json(sanitize(data));
}
