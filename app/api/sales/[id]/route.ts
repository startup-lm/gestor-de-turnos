import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { successResponse, errorResponse, dbErrorResponse } from "@/lib/api/response";
import { revalidateTag } from "next/cache";
import { requireBarberOrAdmin } from "@/lib/api/auth";
import { requirePlanFeature } from "@/lib/flags/server";
import { canModify } from "@/lib/api/ownership";
import { SaleUpdateSchema } from "@/lib/schemas";

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

async function findSaleForChange(id: number) {
  return supabaseAdmin
    .from("sales")
    .select("id, barber_id, price, quantity, arca_invoice_id")
    .eq("id", id)
    .maybeSingle();
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const staff = await requireBarberOrAdmin();
  if (!staff) return errorResponse("No autorizado", 401);
  const planError = await requirePlanFeature("sales");
  if (planError) return planError;

  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  if (Number.isNaN(id)) { return errorResponse("ID inválido", 400); }

  const parsed = SaleUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message ?? "Datos inválidos para modificar la venta", 400);
  }

  const { data: sale, error: findError } = await findSaleForChange(id);
  if (findError) return dbErrorResponse(findError, "sales/id");
  if (!sale) return errorResponse("Venta no encontrada", 404);
  if (!canModify(staff, sale.barber_id)) {
    return errorResponse("Solo podés modificar tus propias ventas", 403);
  }
  // Un barbero no puede pasarle la venta a otro: solo el admin reasigna
  if (parsed.data.barber_id !== undefined && !canModify(staff, parsed.data.barber_id)) {
    return errorResponse("Solo podés registrar ventas a tu nombre", 403);
  }

  if (sale.arca_invoice_id) {
    return errorResponse(
      `No es posible modificar una venta que ya cuenta con comprobante fiscal emitido ante ARCA (Factura #${sale.arca_invoice_id})`,
      400
    );
  }

  const updates = parsed.data;
  // El total siempre se recalcula con los valores finales: nunca se acepta del navegador
  const price = updates.price ?? Number(sale.price);
  const quantity = updates.quantity ?? Number(sale.quantity);

  const { error } = await supabaseAdmin
    .from("sales")
    .update({ ...updates, total: price * quantity })
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

  const { data: sale, error: findError } = await findSaleForChange(id);
  if (findError) return dbErrorResponse(findError, "sales/id");
  if (!sale) return errorResponse("Venta no encontrada", 404);
  if (!canModify(staff, sale.barber_id)) {
    return errorResponse("Solo podés eliminar tus propias ventas", 403);
  }

  if (sale.arca_invoice_id) {
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

