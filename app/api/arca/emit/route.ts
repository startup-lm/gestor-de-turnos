import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { errorResponse, dbErrorResponse } from "@/lib/api/response";
import { revalidateTag } from "next/cache";
import { isServerFeatureEnabled } from "@/lib/flags/server";
import { requireBarberOrAdmin } from "@/lib/api/auth";
import { canModify, isAdminStaff } from "@/lib/api/ownership";
import { ArcaError } from "@/lib/arca/soap";
import { resolveEndpoints } from "@/lib/arca/endpoints";
import { withAccessTicket } from "@/lib/arca/wsaa";
import {
  ERR_WRONG_NUMBER,
  FACTURA_C,
  arcaDate,
  conceptFor,
  formatArcaMessages,
  lastAuthorized,
  requestCae,
  type CaeRequest,
  type CaeResult,
} from "@/lib/arca/wsfe";
import { resolveReceiverCondition } from "@/lib/arca/receiverConditions";
import type { ArcaDocType, ArcaSourceType } from "@/lib/types/Arca";

export const runtime = "nodejs";
export const maxDuration = 60;

const SOURCE_TABLE = { appointment: "appointments", sale: "sales" } as const;
const DOC_TYPES: ArcaDocType[] = [80, 86, 96, 99];

/** Valida el documento del receptor; devuelve el mensaje de error o null */
function docError(docType: ArcaDocType, docNumber: string): string | null {
  if (docType === 99) return null;
  const digits = docNumber.replace(/\D/g, "");
  if (docType === 96) return /^\d{7,8}$/.test(digits) ? null : "El DNI tiene que tener 7 u 8 números";
  return /^\d{11}$/.test(digits) ? null : "El CUIT o CUIL tiene que tener 11 números";
}

export async function POST(req: Request) {
  const staff = await requireBarberOrAdmin();
  if (!staff) return errorResponse("No autorizado", 401);

  const enabled = await isServerFeatureEnabled("arca");
  if (!enabled) return errorResponse("Not Found", 404);

  const payload = await req.json().catch(() => null);
  const sourceType: ArcaSourceType = payload?.sourceType ?? "manual";
  const sourceId = payload?.sourceId != null ? Number(payload.sourceId) : null;

  if (!["appointment", "sale", "manual"].includes(sourceType)) {
    return errorResponse("Origen de comprobante inválido", 400);
  }

  const docType = Number(payload?.docType ?? 99) as ArcaDocType;
  const docNumber = String(payload?.docNumber ?? "").trim();
  if (!DOC_TYPES.includes(docType)) return errorResponse("Tipo de documento inválido", 400);
  const invalidDoc = docError(docType, docNumber);
  if (invalidDoc) return errorResponse(invalidDoc, 400);
  const receiverIvaCondition = resolveReceiverCondition(docType, payload?.receiverIvaCondition);
  if (receiverIvaCondition == null) return errorResponse("Elegí la condición frente al IVA del cliente", 400);

  // El total de un turno o una venta sale de la base, nunca del navegador
  let total: number;
  if (sourceType === "manual") {
    if (!isAdminStaff(staff)) return errorResponse("Solo el admin puede emitir comprobantes manuales", 403);
    total = Number(payload?.total ?? 0);
  } else {
    if (!sourceId || Number.isNaN(sourceId)) return errorResponse("Falta el turno o la venta a facturar", 400);

    const { data: source, error: sourceError } = sourceType === "appointment"
      ? await supabaseAdmin
          .from("appointments")
          .select("id, barber_id, price, paid, arca_invoice_id")
          .eq("id", sourceId)
          .is("deleted_at", null)
          .maybeSingle()
      : await supabaseAdmin
          .from("sales")
          .select("id, barber_id, total, arca_invoice_id")
          .eq("id", sourceId)
          .maybeSingle();

    if (sourceError) return dbErrorResponse(sourceError, "arca/emit");
    const label = sourceType === "appointment" ? "turno" : "venta";
    if (!source) return errorResponse(`No existe ese ${label}`, 404);
    if (!canModify(staff, source.barber_id)) {
      return errorResponse(sourceType === "appointment"
        ? "Solo podés facturar tus propios turnos"
        : "Solo podés facturar tus propias ventas", 403);
    }
    if (source.arca_invoice_id) {
      const { data: existingInv } = await supabaseAdmin
        .from("arca_invoices")
        .select("status")
        .eq("id", source.arca_invoice_id)
        .maybeSingle();

      if (existingInv?.status === "error" || existingInv?.status === "pending") {
        return errorResponse("Este cobro tiene una factura sin confirmar. Verificala en Facturas", 409);
      }
      return errorResponse(sourceType === "appointment" ? "Este turno ya tiene factura" : "Esta venta ya tiene factura", 409);
    }
    if (sourceType === "appointment" && !("paid" in source && source.paid)) {
      return errorResponse("Solo se pueden facturar turnos cobrados", 409);
    }
    total = Number("price" in source ? source.price : source.total);
  }

  if (!total || total <= 0) return errorResponse("Total inválido", 400);

  const { data: config, error } = await supabaseAdmin
    .from("arca_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) return dbErrorResponse(error, "arca/emit");
  if (!config?.cuit || !config.point_of_sale || !config.cert_pem || !config.key_pem) {
    return errorResponse("Completá la configuración de ARCA antes de facturar", 400);
  }

  const pointOfSale = Number(config.point_of_sale);
  const dateStr = arcaDate();
  const voucherDate = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;

  // 1. Comprobante pendiente: reserva el turno o la venta antes de hablar con ARCA,
  //    así dos pedidos simultáneos no sacan dos facturas reales del mismo cobro
  const { data: pending, error: pendingError } = await supabaseAdmin
    .from("arca_invoices")
    .insert({
      status: "pending",
      environment: config.environment === "prod" ? "prod" : "homo",
      total,
      customer_name: payload?.customerName ?? null,
      voucher_type: FACTURA_C,
      invoice_type: FACTURA_C,
      voucher_date: voucherDate,
      point_of_sale: pointOfSale,
      source_type: sourceType,
      source_id: sourceId,
      doc_type: docType,
      doc_number: docType === 99 ? null : docNumber.replace(/\D/g, ""),
      receiver_iva_condition: receiverIvaCondition,
    })
    .select("id")
    .single();

  if (pendingError) return dbErrorResponse(pendingError, "arca/emit");
  const invoiceId: number = pending.id;
  const table = sourceType === "manual" ? null : SOURCE_TABLE[sourceType];

  const release = async () => {
    if (table) {
      await supabaseAdmin.from(table).update({ arca_invoice_id: null }).eq("id", sourceId).eq("arca_invoice_id", invoiceId);
    }
  };
  /** Nada llegó a ARCA: se borra el pendiente y el cobro queda libre para reintentar */
  const discard = async () => {
    await release();
    await supabaseAdmin.from("arca_invoices").delete().eq("id", invoiceId);
  };

  if (table) {
    const { data: marked, error: markError } = await supabaseAdmin
      .from(table)
      .update({ arca_invoice_id: invoiceId })
      .eq("id", sourceId)
      .is("arca_invoice_id", null)
      .select("id");

    if (markError || !marked || marked.length === 0) {
      await supabaseAdmin.from("arca_invoices").delete().eq("id", invoiceId);
      if (markError) return dbErrorResponse(markError, "arca/emit");
      return errorResponse(sourceType === "appointment" ? "Este turno ya tiene factura" : "Esta venta ya tiene factura", 409);
    }
  }

  // 2. ARCA: acceso, próximo número y CAE
  const endpoints = resolveEndpoints(config);
  let sent = false;
  let result: CaeResult;
  try {
    const base: Omit<CaeRequest, "voucherNumber"> = {
      pointOfSale,
      voucherType: FACTURA_C,
      concept: conceptFor(sourceType),
      docType,
      docNumber,
      receiverIvaCondition,
      total,
      date: dateStr,
    };

    result = await withAccessTicket(config, endpoints.wsaa, async (auth) => {
      const attempt = async () => {
        const last = await lastAuthorized(endpoints.wsfe, auth, pointOfSale);
        sent = true;
        await supabaseAdmin.from("arca_invoices").update({ voucher_number: last + 1 }).eq("id", invoiceId);
        return requestCae(endpoints.wsfe, auth, { ...base, voucherNumber: last + 1 });
      };

      let res = await attempt();
      // Otro comprobante tomó el mismo número al mismo tiempo: se pide el número de nuevo una vez
      if (!res.approved && res.errors.some((e) => e.code === ERR_WRONG_NUMBER)) {
        res = await attempt();
      }
      return res;
    });
  } catch (err) {
    const message = err instanceof ArcaError ? err.message : "No se pudo facturar con ARCA";
    if (!sent) {
      await discard();
      return errorResponse(message, 502);
    }
    // ARCA contestó con un error: no hay CAE, se registra como rechazado
    if (err instanceof ArcaError && err.kind !== "network") {
      await release();
      await supabaseAdmin
        .from("arca_invoices")
        .update({ status: "rejected", error_message: message })
        .eq("id", invoiceId);
      revalidateTag("arca-invoices");
      return errorResponse(message, 422);
    }
    // Se mandó el pedido y no hubo respuesta: ARCA pudo haberlo autorizado igual
    console.error("[api:arca/emit] sin respuesta de ARCA", err);
    await supabaseAdmin
      .from("arca_invoices")
      .update({ status: "error", error_message: message })
      .eq("id", invoiceId);
    revalidateTag("arca-invoices");
    return errorResponse("ARCA no respondió. Entrá a Facturas y tocá \"Verificar en ARCA\" antes de volver a facturar", 502);
  }

  const raw = { errors: result.errors, observations: result.observations };

  // 3a. Rechazado: queda registrado con el motivo y el cobro se libera
  if (!result.approved) {
    const reason = formatArcaMessages([...result.errors, ...result.observations]) || "ARCA rechazó el comprobante";
    await release();
    await supabaseAdmin
      .from("arca_invoices")
      .update({ status: "rejected", error_message: reason, raw })
      .eq("id", invoiceId);
    revalidateTag("arca-invoices");
    return errorResponse(`ARCA rechazó el comprobante: ${reason}`, 422);
  }

  // 3b. Aprobado
  const { data: approved, error: updateError } = await supabaseAdmin
    .from("arca_invoices")
    .update({
      status: "approved",
      cae: result.cae,
      cae_due_date: result.caeDueDate,
      voucher_number: result.voucherNumber,
      raw,
    })
    .eq("id", invoiceId)
    .select("id, cae, cae_due_date, voucher_number, voucher_type, point_of_sale")
    .single();

  // El CAE ya existe en ARCA: si falla guardarlo, se loguea con los datos para cargarlo a mano
  if (updateError) {
    console.error("[api:arca/emit] CAE aprobado sin guardar", { invoiceId, cae: result.cae, number: result.voucherNumber });
    return dbErrorResponse(updateError, "arca/emit");
  }

  if (table) revalidateTag(table);
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
