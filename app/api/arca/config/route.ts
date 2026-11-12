import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { errorResponse, dbErrorResponse } from "@/lib/api/response";
import { isServerFeatureEnabled } from "@/lib/flags/server";
import { requireAdmin } from "@/lib/api/auth";
import { urlMatchesEnvironment } from "@/lib/arca/endpoints";
import type { ArcaEnvironment } from "@/lib/types/Arca";

export const runtime = "nodejs";
export const maxDuration = 60;

const ENVIRONMENTS = ["homo", "prod"];

const DEFAULT_CONFIG = {
  environment: "homo",
  cuit: null,
  point_of_sale: null,
  wsaa_url: null,
  wsfe_url: null,
  has_cert: false,
  has_key: false,
  has_passphrase: false,
};

function sanitize(data: Record<string, unknown>) {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const { cert_pem, key_pem, key_passphrase, wsaa_token, wsaa_sign, wsaa_expires_at, ...rest } = data as {
    cert_pem?: string | null;
    key_pem?: string | null;
    key_passphrase?: string | null;
    wsaa_token?: string | null;
    wsaa_sign?: string | null;
    wsaa_expires_at?: string | null;
  };
  /* eslint-enable @typescript-eslint/no-unused-vars */
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

  const payload = await req.json().catch(() => null);
  if (!payload || typeof payload !== "object") return errorResponse("Datos inválidos", 400);

  // Leemos la configuración guardada para comparar entorno y claves de ticket
  const { data: current, error: currentError } = await supabaseAdmin
    .from("arca_settings")
    .select("environment, cuit, cert_pem, key_pem, key_passphrase, wsaa_url, wsfe_url")
    .eq("id", 1)
    .maybeSingle();
  if (currentError) return dbErrorResponse(currentError, "arca/config");

  const stored = (current ?? {}) as Record<string, unknown>;
  const storedEnv = ((stored.environment as ArcaEnvironment) || "homo") as ArcaEnvironment;

  const update: Record<string, unknown> = {
    id: 1,
    updated_at: new Date().toISOString(),
  };

  if ("environment" in payload) {
    if (!ENVIRONMENTS.includes(payload.environment)) return errorResponse("Entorno de ARCA inválido", 400);
    update.environment = payload.environment;
  }

  const targetEnv: ArcaEnvironment = (update.environment as ArcaEnvironment) ?? storedEnv;
  const envChanged = "environment" in payload && payload.environment !== storedEnv;

  if ("cuit" in payload) {
    const cuit = payload.cuit ? String(payload.cuit).replace(/\D/g, "") : null;
    if (cuit && cuit.length !== 11) return errorResponse("El CUIT tiene que tener 11 números", 400);
    update.cuit = cuit;
  }
  if ("pointOfSale" in payload) {
    const pos = payload.pointOfSale == null ? null : Number(payload.pointOfSale);
    if (pos != null && (!Number.isInteger(pos) || pos < 1 || pos > 99999)) {
      return errorResponse("El punto de venta tiene que ser un número entre 1 y 99999", 400);
    }
    update.point_of_sale = pos;
  }

  const hasWsaa = "wsaaUrl" in payload || "wsaa_url" in payload;
  if (hasWsaa) {
    const rawVal = ("wsaaUrl" in payload ? payload.wsaaUrl : payload.wsaa_url) as string | null | undefined;
    const raw = typeof rawVal === "string" ? rawVal.trim() : "";
    if (!raw) {
      update.wsaa_url = null;
    } else {
      if (!urlMatchesEnvironment(raw, targetEnv)) {
        return errorResponse("La dirección de ARCA no corresponde al entorno elegido", 400);
      }
      update.wsaa_url = raw;
    }
  } else if (envChanged) {
    update.wsaa_url = null;
  }

  const hasWsfe = "wsfeUrl" in payload || "wsfe_url" in payload;
  if (hasWsfe) {
    const rawVal = ("wsfeUrl" in payload ? payload.wsfeUrl : payload.wsfe_url) as string | null | undefined;
    const raw = typeof rawVal === "string" ? rawVal.trim() : "";
    if (!raw) {
      update.wsfe_url = null;
    } else {
      if (!urlMatchesEnvironment(raw, targetEnv)) {
        return errorResponse("La dirección de ARCA no corresponde al entorno elegido", 400);
      }
      update.wsfe_url = raw;
    }
  } else if (envChanged) {
    update.wsfe_url = null;
  }

  if ("certPem" in payload && payload.certPem) update.cert_pem = payload.certPem;
  if ("keyPem" in payload && payload.keyPem) update.key_pem = payload.keyPem;
  if ("keyPassphrase" in payload) update.key_passphrase = payload.keyPassphrase || null;

  // El ticket de acceso depende del certificado, la clave y el entorno: si cambian, se pide otro
  const ticketKeys = ["environment", "cuit", "cert_pem", "key_pem", "key_passphrase", "wsaa_url"] as const;
  if (ticketKeys.some((k) => k in update && (update[k] ?? null) !== (stored[k] ?? null))) {
    update.wsaa_token = null;
    update.wsaa_sign = null;
    update.wsaa_expires_at = null;
  }

  const { data, error } = await supabaseAdmin
    .from("arca_settings")
    .upsert(update)
    .select("*")
    .single();

  if (error) return dbErrorResponse(error, "arca/config");
  return NextResponse.json(sanitize(data));
}
