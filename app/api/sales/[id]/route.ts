import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { successResponse, errorResponse } from "@/lib/api/response";
import { revalidateTag } from "next/cache";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
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
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  if (Number.isNaN(id)) { return errorResponse("ID inválido", 400); }
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

  if (error) return errorResponse(error.message);

  revalidateTag("sales");
  return successResponse();
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  if (Number.isNaN(id)) { return errorResponse("ID inválido", 400); }
  const { error } = await supabaseAdmin
    .from("sales")
    .delete()
    .eq("id", id);
  if (error) return errorResponse(error.message);
  revalidateTag("sales");
  return successResponse();
}

