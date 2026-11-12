import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { requireAdmin } from "@/lib/api/auth";
import { isServerFeatureEnabled } from "@/lib/flags/server";
import { errorResponse, dbErrorResponse } from "@/lib/api/response";
import { ArcaError } from "@/lib/arca/soap";
import { resolveEndpoints } from "@/lib/arca/endpoints";
import { withAccessTicket } from "@/lib/arca/wsaa";
import { todayInArgentina } from "@/lib/dates/argentina";
import {
  ERR_WRONG_NUMBER,
  FACTURA_C,
  NOTA_CREDITO_C,
  arcaDate,
  conceptFor,
  formatArcaMessages,
  lastAuthorized,
  requestCae,
  type CaeRequest,
  type CaeResult,
} from "@/lib/arca/wsfe";
import type { ArcaDocType, ArcaSourceType } from "@/lib/types/Arca";

export const runtime = "nodejs";
export const maxDuration = 60;

const SOURCE_TABLE = { appointment: "appointments", sale: "sales" } as const;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("No autorizado", 401);

  const enabled = await isServerFeatureEnabled("arca");
  if (!enabled) return errorResponse("Not Found", 404);

  const { id } = await params;
  const invoiceId = Number(id);
  if (!invoiceId || Number.isNaN(invoiceId)) {
    return errorResponse("Factura no encontrada", 404);
  }

  // 1. Lectura de la factura original
  const { data: original, error: origError } = await supabaseAdmin
    .from("arca_invoices")
    .select("*")
    .eq("id", invoiceId)
    .maybeSingle();

  if (origError) return dbErrorResponse(origError, "arca/credit-note");
  if (!original) return errorResponse("Factura no encontrada", 404);

  // 2. Lectura de la configuración activa
  const { data: config, error: configError } = await supabaseAdmin
    .from("arca_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (configError) return dbErrorResponse(configError, "arca/credit-note");
  if (!config?.cuit || !config.point_of_sale || !config.cert_pem || !config.key_pem) {
    return errorResponse("Completá la configuración de ARCA antes de facturar", 400);
  }

  // 3. Validaciones de la factura original (approved, tipo 11, entorno activo, sin nota previa)
  if (original.status !== "approved") {
    return errorResponse("Solo se pueden anular facturas aprobadas", 409);
  }

  const origType = original.invoice_type ?? original.voucher_type;
  if (origType !== FACTURA_C) {
    return errorResponse("Solo se pueden anular facturas tipo C", 409);
  }

  const activeEnv = config.environment === "prod" ? "prod" : "homo";
  const origEnv = original.environment ?? "homo";
  if (origEnv !== activeEnv) {
    return errorResponse("Esta factura es de otro entorno de ARCA", 409);
  }

  if (original.voucher_number == null) {
    return errorResponse("La factura original no posee número autorizado", 409);
  }

  const { data: existingCn, error: cnCheckError } = await supabaseAdmin
    .from("arca_invoices")
    .select("id, status")
    .eq("credit_note_of_id", original.id)
    .neq("status", "rejected")
    .maybeSingle();

  if (cnCheckError) return dbErrorResponse(cnCheckError, "arca/credit-note");
  if (existingCn) {
    return errorResponse("Esta factura ya tiene una nota de crédito", 409);
  }

  // 4. Parámetros del comprobante
  const pointOfSale = Number(config.point_of_sale);
  const dateStr = arcaDate();
  const voucherDate = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
  const sourceType: ArcaSourceType = original.source_type ?? "manual";
  const docType = (original.doc_type ?? 99) as ArcaDocType;
  const docNumber = original.doc_number ?? "";
  const receiverIvaCondition = original.receiver_iva_condition ?? 5;
  const total = Number(original.total);

  // 5. Creación del comprobante pendiente (mismo flujo seguro que emit)
  const { data: pending, error: pendingError } = await supabaseAdmin
    .from("arca_invoices")
    .insert({
      status: "pending",
      environment: activeEnv,
      total,
      customer_name: original.customer_name ?? null,
      voucher_type: NOTA_CREDITO_C,
      invoice_type: NOTA_CREDITO_C,
      voucher_date: voucherDate,
      point_of_sale: pointOfSale,
      source_type: original.source_type ?? null,
      source_id: original.source_id ?? null,
      doc_type: docType,
      doc_number: docType === 99 ? null : docNumber.replace(/\D/g, ""),
      receiver_iva_condition: receiverIvaCondition,
      credit_note_of_id: original.id,
    })
    .select("id")
    .single();

  if (pendingError) {
    if ((pendingError as { code?: string }).code === "23505") {
      return errorResponse("Esta factura ya tiene una nota de crédito", 409);
    }
    return dbErrorResponse(pendingError, "arca/credit-note");
  }
  const creditNoteId: number = pending.id;

  const discard = async () => {
    await supabaseAdmin.from("arca_invoices").delete().eq("id", creditNoteId);
  };

  // 6. Comunicación con ARCA
  const origDateRaw = original.voucher_date
    ? original.voucher_date.replace(/-/g, "")
    : original.created_at
    ? todayInArgentina(new Date(original.created_at)).replace(/-/g, "")
    : dateStr;

  const associated = {
    type: FACTURA_C,
    pointOfSale: Number(original.point_of_sale ?? pointOfSale),
    number: Number(original.voucher_number),
    cuit: String(config.cuit).replace(/\D/g, ""),
    date: origDateRaw,
  };

  const base: Omit<CaeRequest, "voucherNumber"> = {
    pointOfSale,
    voucherType: NOTA_CREDITO_C,
    concept: conceptFor(sourceType),
    docType,
    docNumber,
    receiverIvaCondition,
    total,
    date: dateStr,
    associated,
  };

  const endpoints = resolveEndpoints(config);
  let sent = false;
  let result: CaeResult;

  try {
    result = await withAccessTicket(config, endpoints.wsaa, async (auth) => {
      const attempt = async () => {
        const last = await lastAuthorized(endpoints.wsfe, auth, pointOfSale, NOTA_CREDITO_C);
        sent = true;
        await supabaseAdmin
          .from("arca_invoices")
          .update({ voucher_number: last + 1 })
          .eq("id", creditNoteId);
        return requestCae(endpoints.wsfe, auth, { ...base, voucherNumber: last + 1 });
      };

      let res = await attempt();
      if (!res.approved && res.errors.some((e) => e.code === ERR_WRONG_NUMBER)) {
        res = await attempt();
      }
      return res;
    });
  } catch (err) {
    const message = err instanceof ArcaError ? err.message : "No se pudo emitir la nota de crédito";
    if (!sent) {
      await discard();
      return errorResponse(message, 502);
    }
    if (err instanceof ArcaError && err.kind !== "network") {
      await supabaseAdmin
        .from("arca_invoices")
        .update({ status: "rejected", error_message: message })
        .eq("id", creditNoteId);
      revalidateTag("arca-invoices");
      return errorResponse(message, 422);
    }

    console.error("[api:arca/credit-note] sin respuesta de ARCA", err);
    await supabaseAdmin
      .from("arca_invoices")
      .update({ status: "error", error_message: message })
      .eq("id", creditNoteId);
    revalidateTag("arca-invoices");
    return errorResponse("ARCA no respondió. Entrá a Facturas y tocá \"Verificar en ARCA\" antes de volver a facturar", 502);
  }

  const raw = { errors: result.errors, observations: result.observations };

  // 7a. Rechazada: queda como rejected, la original no se anula
  if (!result.approved) {
    const reason = formatArcaMessages([...result.errors, ...result.observations]) || "ARCA rechazó el comprobante";
    await supabaseAdmin
      .from("arca_invoices")
      .update({ status: "rejected", error_message: reason, raw })
      .eq("id", creditNoteId);
    revalidateTag("arca-invoices");
    return errorResponse(`ARCA rechazó la nota de crédito: ${reason}`, 422);
  }

  // 7b. Aprobada: se autoriza la nota de crédito, la original pasa a voided y se libera el cobro
  const { data: approved, error: updateError } = await supabaseAdmin
    .from("arca_invoices")
    .update({
      status: "approved",
      cae: result.cae,
      cae_due_date: result.caeDueDate,
      voucher_number: result.voucherNumber,
      credit_note_of_id: original.id,
      raw,
    })
    .eq("id", creditNoteId)
    .select("id, cae, cae_due_date, voucher_number, voucher_type, point_of_sale")
    .single();

  if (updateError) {
    console.error("[api:arca/credit-note] CAE aprobado sin guardar", { creditNoteId, cae: result.cae, number: result.voucherNumber });
    return dbErrorResponse(updateError, "arca/credit-note");
  }

  // La original pasa a 'voided'
  await supabaseAdmin
    .from("arca_invoices")
    .update({ status: "voided" })
    .eq("id", original.id);

  // Se libera su turno o venta
  const sourceTable = original.source_type && SOURCE_TABLE[original.source_type as keyof typeof SOURCE_TABLE];
  if (sourceTable && original.source_id) {
    await supabaseAdmin
      .from(sourceTable)
      .update({ arca_invoice_id: null })
      .eq("id", original.source_id)
      .eq("arca_invoice_id", original.id);
    revalidateTag(sourceTable);
  }

  revalidateTag("arca-invoices");

  return NextResponse.json({
    success: true,
    invoiceId: approved.id,
    cae: approved.cae,
    caeDueDate: approved.cae_due_date,
    voucherNumber: approved.voucher_number,
    voucherType: approved.voucher_type,
    pointOfSale: approved.point_of_sale,
  });
}
