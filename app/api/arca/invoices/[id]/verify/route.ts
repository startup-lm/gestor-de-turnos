import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { requireAdmin } from "@/lib/api/auth";
import { isServerFeatureEnabled } from "@/lib/flags/server";
import { errorResponse, dbErrorResponse } from "@/lib/api/response";
import { ArcaError } from "@/lib/arca/soap";
import { resolveEndpoints } from "@/lib/arca/endpoints";
import { getAccessTicket } from "@/lib/arca/wsaa";
import { consultVoucher, FACTURA_C, type VoucherLookup, type WsfeAuth } from "@/lib/arca/wsfe";

const SOURCE_TABLE: Record<string, string> = {
  appointment: "appointments",
  sale: "sales",
};

function normalizeDocNumber(value: unknown): string {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits === "" || digits === "0" ? "0" : digits;
}

async function releaseSource(inv: { source_type: string | null; source_id: number | null; id: number }) {
  if (inv.source_type && SOURCE_TABLE[inv.source_type] && inv.source_id) {
    await supabaseAdmin
      .from(SOURCE_TABLE[inv.source_type])
      .update({ arca_invoice_id: null })
      .eq("id", inv.source_id)
      .eq("arca_invoice_id", inv.id);
  }
}

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

  const { data: inv, error: invError } = await supabaseAdmin
    .from("arca_invoices")
    .select("*")
    .eq("id", invoiceId)
    .maybeSingle();

  if (invError) return dbErrorResponse(invError, "arca/verify");
  if (!inv) return errorResponse("Factura no encontrada", 404);

  const isError = inv.status === "error";
  const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
  const createdAtMs = inv.created_at ? new Date(inv.created_at).getTime() : 0;
  const isPendingOverdue = inv.status === "pending" && createdAtMs <= twoMinutesAgo;

  if (!isError && !isPendingOverdue) {
    return errorResponse("Esta factura no necesita verificación", 409);
  }

  if (inv.voucher_number == null) {
    await supabaseAdmin
      .from("arca_invoices")
      .update({ status: "rejected", error_message: "No llegó a enviarse a ARCA" })
      .eq("id", inv.id);
    await releaseSource(inv);
    revalidateTag("arca-invoices");
    if (inv.source_type && SOURCE_TABLE[inv.source_type]) {
      revalidateTag(SOURCE_TABLE[inv.source_type]);
    }
    return NextResponse.json({ success: true, status: "rejected" });
  }

  const { data: config, error: configError } = await supabaseAdmin
    .from("arca_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (configError) return dbErrorResponse(configError, "arca/verify");
  if (!config?.cuit || !config.point_of_sale || !config.cert_pem || !config.key_pem) {
    return errorResponse("Completá la configuración de ARCA antes de facturar", 400);
  }

  const endpoints = resolveEndpoints(config);
  let lookup: VoucherLookup;
  try {
    const ticket = await getAccessTicket(config, endpoints.wsaa);
    const auth: WsfeAuth = { ...ticket, cuit: String(config.cuit).replace(/\D/g, "") };
    const ptoVta = inv.point_of_sale ? Number(inv.point_of_sale) : Number(config.point_of_sale);
    const voucherType = inv.voucher_type ?? FACTURA_C;
    lookup = await consultVoucher(endpoints.wsfe, auth, ptoVta, inv.voucher_number, voucherType);
  } catch (err) {
    if (err instanceof ArcaError) {
      return errorResponse(err.message, 502);
    }
    return errorResponse("No se pudo verificar el comprobante con ARCA", 502);
  }

  const docMatches =
    normalizeDocNumber(lookup.found ? lookup.docNumber : "") === normalizeDocNumber(inv.doc_number);
  const totalMatches = lookup.found && Math.abs(Number(lookup.total) - Number(inv.total)) < 0.01;

  if (lookup.found && lookup.approved && totalMatches && docMatches) {
    await supabaseAdmin
      .from("arca_invoices")
      .update({
        status: "approved",
        cae: lookup.cae,
        cae_due_date: lookup.caeDueDate,
        error_message: null,
      })
      .eq("id", inv.id);

    revalidateTag("arca-invoices");
    return NextResponse.json({ success: true, status: "approved", cae: lookup.cae });
  }

  // No found, o encontrado pero con otros datos (ese número lo usó otro comprobante)
  await supabaseAdmin
    .from("arca_invoices")
    .update({
      status: "rejected",
      error_message: "ARCA no tiene este comprobante: no se emitió",
      voucher_number: null,
    })
    .eq("id", inv.id);

  await releaseSource(inv);
  revalidateTag("arca-invoices");
  if (inv.source_type && SOURCE_TABLE[inv.source_type]) {
    revalidateTag(SOURCE_TABLE[inv.source_type]);
  }

  return NextResponse.json({ success: true, status: "rejected" });
}
