import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { errorResponse, dbErrorResponse } from "@/lib/api/response";
import { isServerFeatureEnabled } from "@/lib/flags/server";
import { requireAdmin } from "@/lib/api/auth";
import { ArcaError } from "@/lib/arca/soap";
import { resolveEndpoints } from "@/lib/arca/endpoints";
import { getAccessTicket } from "@/lib/arca/wsaa";
import { dummy, lastAuthorized } from "@/lib/arca/wsfe";
import type { ArcaTestResult } from "@/lib/types/Arca";

const detail = (err: unknown) => (err instanceof ArcaError ? err.message : "Error inesperado");

/** Probar conexión: servidores de ARCA, login con el certificado y último comprobante del punto de venta */
export async function POST() {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("No autorizado", 401);

  const enabled = await isServerFeatureEnabled("arca");
  if (!enabled) return errorResponse("Not Found", 404);

  const { data: config, error } = await supabaseAdmin
    .from("arca_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) return dbErrorResponse(error, "arca/test");
  if (!config) return errorResponse("Guardá la configuración de ARCA antes de probarla", 400);

  const endpoints = resolveEndpoints(config);
  const steps: ArcaTestResult["steps"] = [];

  try {
    const status = await dummy(endpoints.wsfe);
    const ok = status.appServer === "OK" && status.dbServer === "OK" && status.authServer === "OK";
    steps.push({ label: "Servidores de ARCA", ok, detail: ok ? "Funcionando" : "ARCA informa una falla en sus servidores" });
  } catch (err) {
    steps.push({ label: "Servidores de ARCA", ok: false, detail: detail(err) });
    return NextResponse.json({ success: false, steps } satisfies ArcaTestResult);
  }

  let ticket;
  try {
    ticket = await getAccessTicket(config, endpoints.wsaa);
    steps.push({ label: "Certificado y clave", ok: true, detail: "ARCA aceptó el certificado" });
  } catch (err) {
    steps.push({ label: "Certificado y clave", ok: false, detail: detail(err) });
    return NextResponse.json({ success: false, steps } satisfies ArcaTestResult);
  }

  if (!config.cuit || !config.point_of_sale) {
    steps.push({ label: "Punto de venta", ok: false, detail: "Falta el CUIT o el punto de venta" });
    return NextResponse.json({ success: false, steps } satisfies ArcaTestResult);
  }

  try {
    const auth = { ...ticket, cuit: String(config.cuit).replace(/\D/g, "") };
    const last = await lastAuthorized(endpoints.wsfe, auth, Number(config.point_of_sale));
    steps.push({ label: "Punto de venta", ok: true, detail: `Último comprobante C autorizado: ${last}` });
  } catch (err) {
    steps.push({ label: "Punto de venta", ok: false, detail: detail(err) });
    return NextResponse.json({ success: false, steps } satisfies ArcaTestResult);
  }

  return NextResponse.json({ success: true, steps } satisfies ArcaTestResult);
}
