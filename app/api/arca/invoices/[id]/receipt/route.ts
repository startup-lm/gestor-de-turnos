import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { requireAdmin } from "@/lib/api/auth";
import { isServerFeatureEnabled } from "@/lib/flags/server";
import { errorResponse, dbErrorResponse } from "@/lib/api/response";
import { buildArcaQrUrl } from "@/lib/arca/qr";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(
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
    return errorResponse("Comprobante no encontrado", 404);
  }

  const { data: invoice, error: invoiceError } = await supabaseAdmin
    .from("arca_invoices")
    .select("*")
    .eq("id", invoiceId)
    .maybeSingle();

  if (invoiceError) return dbErrorResponse(invoiceError, "arca/receipt");
  if (!invoice) return errorResponse("Comprobante no encontrado", 404);

  if (!invoice.cae) {
    return errorResponse("El comprobante no posee autorización CAE", 400);
  }

  const { data: config, error: configError } = await supabaseAdmin
    .from("arca_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (configError) return dbErrorResponse(configError, "arca/receipt");

  const cuit = config?.cuit ?? "";
  const qrUrl = buildArcaQrUrl(invoice, cuit);

  const issuer = {
    legalName: config?.legal_name ?? null,
    fiscalAddress: config?.fiscal_address ?? null,
    grossIncome: config?.gross_income ?? null,
    activityStartDate: config?.activity_start_date ?? null,
    cuit: cuit || null,
    pointOfSale: invoice.point_of_sale ?? config?.point_of_sale ?? null,
    taxCondition: "Responsable Monotributo",
  };

  return NextResponse.json({
    invoice,
    issuer,
    qrUrl,
  });
}
