import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { successResponse, errorResponse, dbErrorResponse } from "@/lib/api/response";
import { revalidateTag } from "next/cache";
import { requireBarberOrAdmin } from "@/lib/api/auth";
import { requirePlanFeature } from "@/lib/flags/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const staff = await requireBarberOrAdmin();
  if (!staff) return errorResponse("No autorizado", 401);

  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  if (Number.isNaN(id)) { return errorResponse("ID inválido", 400); }

  const { data, error } = await supabaseAdmin
    .from("sales")
    .select("*, barbers(name), products(name), arca_invoices(*)")
    .eq("id", id)
    .single();

  if (error || !data) return errorResponse("Venta no encontrada", 404);
  return NextResponse.json(data);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const staff = await requireBarberOrAdmin();
  if (!staff) return errorResponse("No autorizado", 401);
  const planError = await requirePlanFeature("sales");
  if (planError) return planError;

  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  if (Number.isNaN(id)) { return errorResponse("ID inválido", 400); }

  // Validar si la venta ya posee comprobante fiscal emitido
  const { data: sale, error: findError } = await supabaseAdmin
    .from("sales")
    .select("arca_invoice_id")
    .eq("id", id)
    .maybeSingle();

  if (findError) return dbErrorResponse(findError, "sales/id");
  if (!sale) return errorResponse("Venta no encontrada", 404);

  if (sale.arca_invoice_id) {
    return errorResponse(
      `No es posible modificar una venta que ya cuenta con comprobante fiscal emitido ante ARCA (Factura #${sale.arca_invoice_id})`,
      400
    );
  }

  const body = await request.json();
  const { barber_id, product_id, price, quantity, total, details } = body as {
    barber_id?: number;
    product_id?: number;
    price?: number;
    quantity?: number;
    total?: number;
    details?: string;
  };

  const updateData: Record<string, unknown> = {};
  if (barber_id !== undefined) updateData.barber_id = barber_id;
  if (product_id !== undefined) updateData.product_id = product_id;
  if (price !== undefined) updateData.price = price;
  if (quantity !== undefined) updateData.quantity = quantity;
  if (total !== undefined) {
    updateData.total = total;
  } else if (price !== undefined && quantity !== undefined) {
    updateData.total = price * quantity;
  }
  if (details !== undefined) updateData.details = details;

  const { error } = await supabaseAdmin
    .from("sales")
    .update(updateData)
    .eq("id", id);

  if (error) return dbErrorResponse(error, "sales/id");

  revalidateTag("sales");
  return successResponse();
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const staff = await requireBarberOrAdmin();
  if (!staff) return errorResponse("No autorizado", 401);
  const planError = await requirePlanFeature("sales");
  if (planError) return planError;

  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  if (Number.isNaN(id)) { return errorResponse("ID inválido", 400); }

  const { data: sale } = await supabaseAdmin
    .from("sales")
    .select("arca_invoice_id")
    .eq("id", id)
    .single();

  if (sale?.arca_invoice_id) {
    return errorResponse(
      "No es posible eliminar una venta que ya cuenta con comprobante fiscal emitido ante ARCA",
      400
    );
  }

  const { error } = await supabaseAdmin
    .from("sales")
    .delete()
    .eq("id", id);
  if (error) return dbErrorResponse(error, "sales/id");
  revalidateTag("sales");
  return successResponse();
}

