import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { errorResponse, dbErrorResponse } from "@/lib/api/response";
import { isServerFeatureEnabled } from "@/lib/flags/server";
import { requireAdmin } from "@/lib/api/auth";
import { ArcaError } from "@/lib/arca/soap";
import { resolveEndpoints } from "@/lib/arca/endpoints";
import { certificateExpiry, getAccessTicket, withAccessTicket } from "@/lib/arca/wsaa";
import { dummy, lastAuthorized, pointsOfSale } from "@/lib/arca/wsfe";
import type { ArcaTestResult } from "@/lib/types/Arca";

export const runtime = "nodejs";
export const maxDuration = 60;

const detail = (err: unknown) => (err instanceof ArcaError ? err.message : "Error inesperado");

function formatArDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/** Probar conexión: servidores de ARCA, login con el certificado, vencimiento, punto de venta y último comprobante */
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

  try {
    await getAccessTicket(config, endpoints.wsaa);
    steps.push({ label: "Certificado y clave", ok: true, detail: "ARCA aceptó el certificado" });
  } catch (err) {
    steps.push({ label: "Certificado y clave", ok: false, detail: detail(err) });
    return NextResponse.json({ success: false, steps } satisfies ArcaTestResult);
  }

  // Vencimiento del certificado (no corta la prueba)
  const expiry = config.cert_pem ? certificateExpiry(config.cert_pem) : null;
  if (!expiry) {
    steps.push({ label: "Vencimiento del certificado", ok: false, detail: "No se pudo leer la fecha de vencimiento" });
  } else {
    const dateFormatted = formatArDate(expiry);
    const diffMs = expiry.getTime() - Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    if (diffMs <= 0) {
      steps.push({ label: "Vencimiento del certificado", ok: false, detail: `Venció el ${dateFormatted}` });
    } else if (diffMs <= thirtyDaysMs) {
      steps.push({ label: "Vencimiento del certificado", ok: false, detail: `Vence el ${dateFormatted}: renovalo pronto` });
    } else {
      steps.push({ label: "Vencimiento del certificado", ok: true, detail: `Vence el ${dateFormatted}` });
    }
  }

  if (!config.cuit || !config.point_of_sale) {
    steps.push({ label: "Punto de venta", ok: false, detail: "Falta el CUIT o el punto de venta" });
    return NextResponse.json({ success: false, steps } satisfies ArcaTestResult);
  }

  const ptoVta = Number(config.point_of_sale);
  try {
    await withAccessTicket(config, endpoints.wsaa, async (auth) => {
      const posList = await pointsOfSale(endpoints.wsfe, auth);
      if (posList === null) {
        steps.push({
          label: "Punto de venta habilitado",
          ok: true,
          detail: "ARCA no informa puntos de venta (normal en homologación)",
        });
      } else {
        const found = posList.find((p) => p.number === ptoVta);
        if (!found) {
          steps.push({
            label: "Punto de venta habilitado",
            ok: false,
            detail: `El punto de venta ${ptoVta} no está habilitado para factura electrónica por web service. Crealo en ARCA como 'RECE para aplicativo y web services'`,
          });
          return;
        }
        if (found.blocked) {
          steps.push({
            label: "Punto de venta habilitado",
            ok: false,
            detail: "El punto de venta está bloqueado",
          });
          return;
        }
        if (found.deregistered) {
          steps.push({
            label: "Punto de venta habilitado",
            ok: false,
            detail: "El punto de venta está dado de baja",
          });
          return;
        }
        steps.push({
          label: "Punto de venta habilitado",
          ok: true,
          detail: found.emissionType,
        });
      }

      const last = await lastAuthorized(endpoints.wsfe, auth, ptoVta);
      steps.push({ label: "Punto de venta", ok: true, detail: `Último comprobante C autorizado: ${last}` });
    });
  } catch (err) {
    const hasPtoHabilitado = steps.some((s) => s.label === "Punto de venta habilitado");
    if (!hasPtoHabilitado) {
      steps.push({ label: "Punto de venta habilitado", ok: false, detail: detail(err) });
    } else {
      steps.push({ label: "Punto de venta", ok: false, detail: detail(err) });
    }
    return NextResponse.json({ success: false, steps } satisfies ArcaTestResult);
  }

  const success = steps.every((s) => s.ok);
  return NextResponse.json({ success, steps } satisfies ArcaTestResult);
}
