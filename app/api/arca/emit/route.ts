import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { errorResponse } from "@/lib/api/response";
import { revalidateTag } from "next/cache";

function randomCae(): string {
  const min = 10 ** 13;
  const max = 10 ** 14 - 1;
  return String(Math.floor(min + Math.random() * (max - min)));
}

function formatDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export async function POST(req: Request) {
  const payload = await req.json();
  const total = Number(payload?.total ?? 0);
  if (!total || total <= 0) return errorResponse("Total inválido", 400);

  const { data: config, error } = await supabaseAdmin
    .from("arca_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) return errorResponse(`ARCA: ${error.message}`);
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
    source_type: payload?.sourceType ?? "manual",
    source_id:   payload?.sourceId ?? null,
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

  if (insertError) return errorResponse(`ARCA: ${insertError.message}`);

  // Si el comprobante viene de un turno, actualizar appointments.arca_invoice_id
  if (payload?.sourceType === "appointment" && payload?.sourceId) {
    await supabaseAdmin
      .from("appointments")
      .update({ arca_invoice_id: inserted.id })
      .eq("id", payload.sourceId);
    revalidateTag("appointments");
  }

  // Si viene de una venta, actualizar sales.arca_invoice_id
  if (payload?.sourceType === "sale" && payload?.sourceId) {
    await supabaseAdmin
      .from("sales")
      .update({ arca_invoice_id: inserted.id })
      .eq("id", payload.sourceId);
    revalidateTag("sales");
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
