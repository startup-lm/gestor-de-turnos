import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { errorResponse, dbErrorResponse } from "@/lib/api/response";
import { revalidateTag } from "next/cache";
import { isServerFeatureEnabled } from "@/lib/flags/server";
import { requireBarberOrAdmin } from "@/lib/api/auth";
import { canModify, isAdminStaff } from "@/lib/api/ownership";

function randomCae(): string {
  const min = 10 ** 13;
  const max = 10 ** 14 - 1;
  return String(Math.floor(min + Math.random() * (max - min)));
}

function formatDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

type SourceType = "appointment" | "sale" | "manual";

const SOURCE_TABLE = { appointment: "appointments", sale: "sales" } as const;

export async function POST(req: Request) {
  const staff = await requireBarberOrAdmin();
  if (!staff) return errorResponse("No autorizado", 401);

  const enabled = await isServerFeatureEnabled("arca");
  if (!enabled) return errorResponse("Not Found", 404);

  const payload = await req.json().catch(() => null);
  const sourceType: SourceType = payload?.sourceType ?? "manual";
  const sourceId = payload?.sourceId != null ? Number(payload.sourceId) : null;

  if (!["appointment", "sale", "manual"].includes(sourceType)) {
    return errorResponse("Origen de comprobante inválido", 400);
  }

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
  if (!config) return errorResponse("ARCA no configurado", 400);

  if (config.environment !== "mock") {
    // TODO Fase 6: integrar con wsaa.ts + wsfe.ts para homo/prod
    return errorResponse(
      "Integración ARCA real no habilitada. Usá entorno Demo o completá WSAA/WSFE.",
      400
    );
  }

  // ── Modo Mock ─────────────────────────────────────────────────────────────
  const { data: last } = await supabaseAdmin
    .from("arca_invoices")
    .select("voucher_number")
    .order("voucher_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextNumber = (last?.voucher_number ?? 0) + 1;
  const cae = randomCae();
  const caeDueDate = formatDate(new Date(Date.now() + 10 * 24 * 60 * 60 * 1000));
  const voucherType = Number(payload?.voucherType ?? 11);
  const invoiceType = Number(payload?.invoiceType ?? 11);
  const pointOfSale = config.point_of_sale ?? 1;

  const record = {
    status: "mock",
    total,
    customer_name: payload?.customerName ?? null,
    cae,
    cae_due_date: caeDueDate,
    voucher_number: nextNumber,
    voucher_type: voucherType,
    invoice_type: invoiceType,
    point_of_sale: pointOfSale,
    // Trazabilidad
    source_type: sourceType,
    source_id:   sourceId,
    doc_type:    payload?.docType ?? 99,   // 99 = Consumidor Final por defecto
    doc_number:  payload?.docNumber ?? null,
    raw: payload ?? {},
  };

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("arca_invoices")
    .insert(record)
    .select(
      "id, created_at, status, total, customer_name, cae, cae_due_date, voucher_number, voucher_type, point_of_sale, source_type, source_id"
    )
    .single();

  if (insertError) return dbErrorResponse(insertError, "arca/emit");

  if (sourceType !== "manual") {
    // Marca condicional: si otro pedido facturó el mismo origen en paralelo, este no pisa la marca
    const table = SOURCE_TABLE[sourceType];
    const { data: marked, error: markError } = await supabaseAdmin
      .from(table)
      .update({ arca_invoice_id: inserted.id })
      .eq("id", sourceId)
      .is("arca_invoice_id", null)
      .select("id");

    if (markError || !marked || marked.length === 0) {
      // Deshacer el comprobante recién creado para no dejar uno huérfano
      await supabaseAdmin.from("arca_invoices").delete().eq("id", inserted.id);
      if (markError) return dbErrorResponse(markError, "arca/emit");
      return errorResponse(sourceType === "appointment" ? "Este turno ya tiene factura" : "Esta venta ya tiene factura", 409);
    }
    revalidateTag(table);
  }

  revalidateTag("arca-invoices");

  return NextResponse.json({
    success: true,
    invoiceId: inserted.id,
    cae: inserted.cae,
    caeDueDate: inserted.cae_due_date,
    voucherNumber: inserted.voucher_number,
    voucherType: inserted.voucher_type,
    pointOfSale: inserted.point_of_sale,
  });
}
