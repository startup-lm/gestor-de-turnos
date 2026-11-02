import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { errorResponse, dbErrorResponse } from "@/lib/api/response";
import { requireBarberOrAdmin } from "@/lib/api/auth";

const DEFAULT_STATUS = {
  environment: "mock",
  ready: true,
  cuit: null,
  point_of_sale: null,
  has_cert: false,
  has_key: false,
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
  const ready =
    data.environment === "mock" ||
    (!!data.cuit &&
      !!data.point_of_sale &&
      hasCert &&
      hasKey &&
      !!data.wsaa_url &&
      !!data.wsfe_url);

  return NextResponse.json({
    environment: data.environment,
    ready,
    cuit: data.cuit ?? null,
    point_of_sale: data.point_of_sale ?? null,
    has_cert: hasCert,
    has_key: hasKey,
    wsaa_url: data.wsaa_url ?? null,
    wsfe_url: data.wsfe_url ?? null,
  });
}
