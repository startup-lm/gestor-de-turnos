import { NextResponse } from "next/server";

import { successResponse, errorResponse, dbErrorResponse } from "@/lib/api/response";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { requireBarberOrAdmin } from "@/lib/api/auth";
import { requirePlanFeature } from "@/lib/flags/server";
import { revalidateTag } from "next/cache";

export async function GET() {
  const staff = await requireBarberOrAdmin();
  if (!staff) return errorResponse("No autorizado", 401);

  const { data, error } = await supabaseAdmin
    .from("sales")
    .select("*, barbers(name), products(name)")
    .order("id", { ascending: true });

  if (error) return dbErrorResponse(error, "sales");
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const staff = await requireBarberOrAdmin();
  if (!staff) return errorResponse("No autorizado", 401);
  const planError = await requirePlanFeature("sales");
  if (planError) return planError;

  const { barber_id, product_id, price, quantity, details, total } = await request.json();
  const { data, error } = await supabaseAdmin
    .from("sales")
    .insert({ barber_id, product_id, price, quantity, details, total })
    .select("id")
    .single();

  if (error) return dbErrorResponse(error, "sales");
  revalidateTag("sales");
  return NextResponse.json({ success: true, id: data.id });
}

export async function PUT(request: Request) {
  const staff = await requireBarberOrAdmin();
  if (!staff) return errorResponse("No autorizado", 401);
  const planError = await requirePlanFeature("sales");
  if (planError) return planError;

  const { id, barber_id, product_id, price, quantity, details } = await request.json();

  // Validar si la venta ya posee comprobante fiscal emitido
  const { data: sale, error: findError } = await supabaseAdmin
    .from("sales")
    .select("arca_invoice_id")
    .eq("id", id)
    .maybeSingle();

  if (findError) return dbErrorResponse(findError, "sales");
  if (!sale) return errorResponse("Venta no encontrada", 404);

  if (sale.arca_invoice_id) {
    return errorResponse(
      `No es posible modificar una venta que ya cuenta con comprobante fiscal emitido ante ARCA (Factura #${sale.arca_invoice_id})`,
      400
    );
  }

  const { data, error } = await supabaseAdmin
    .from("sales")
    .update({
      barber_id,
      product_id,
      price,
      quantity,
      details,
      total: price * quantity,
    })
    .eq("id", id)
    .select("id");

  if (error) return dbErrorResponse(error, "sales");
  if (!data || data.length === 0) return errorResponse("Venta no encontrada", 404);
  revalidateTag("sales");
  return successResponse();
}

export async function DELETE(request: Request) {
  const staff = await requireBarberOrAdmin();
  if (!staff) return errorResponse("No autorizado", 401);
  const planError = await requirePlanFeature("sales");
  if (planError) return planError;

  const { id } = await request.json();

  // Validar si la venta ya posee comprobante fiscal emitido
  const { data: sale, error: findError } = await supabaseAdmin
    .from("sales")
    .select("arca_invoice_id")
    .eq("id", id)
    .maybeSingle();

  if (findError) return dbErrorResponse(findError, "sales");
  if (!sale) return errorResponse("Venta no encontrada", 404);

  if (sale.arca_invoice_id) {
    return errorResponse(
      `No es posible eliminar una venta que ya cuenta con comprobante fiscal emitido ante ARCA (Factura #${sale.arca_invoice_id})`,
      400
    );
  }

  const { data, error } = await supabaseAdmin.from("sales").delete().eq("id", id).select("id");
  if (error) return dbErrorResponse(error, "sales");
  if (!data || data.length === 0) return errorResponse("Venta no encontrada", 404);
  revalidateTag("sales");
  return successResponse();
}
