import { NextResponse } from "next/server";

import { successResponse, errorResponse } from "@/lib/api/response";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { requireBarberOrAdmin } from "@/lib/api/auth";
import { revalidateTag } from "next/cache";

export async function GET() {
  const staff = await requireBarberOrAdmin();
  if (!staff) return errorResponse("No autorizado", 401);

  const { data, error } = await supabaseAdmin
    .from("sales")
    .select("*, barbers(name), products(name)")
    .order("id", { ascending: true });

  if (error) return errorResponse(error.message);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const staff = await requireBarberOrAdmin();
  if (!staff) return errorResponse("No autorizado", 401);

  const { barber_id, product_id, price, quantity, details, total } = await request.json();
  const { error } = await supabaseAdmin
    .from("sales")
    .insert({ barber_id, product_id, price, quantity, details, total });

  if (error) return errorResponse(error.message);
  revalidateTag("sales");
  return successResponse();
}

export async function PUT(request: Request) {
  const staff = await requireBarberOrAdmin();
  if (!staff) return errorResponse("No autorizado", 401);

  const { id, barber_id, product_id, price, quantity, details } = await request.json();
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

  if (error) return errorResponse(error.message);
  if (!data || data.length === 0) return errorResponse("Venta no encontrada", 404);
  revalidateTag("sales");
  return successResponse();
}

export async function DELETE(request: Request) {
  const staff = await requireBarberOrAdmin();
  if (!staff) return errorResponse("No autorizado", 401);

  const { id } = await request.json();
  const { data, error } = await supabaseAdmin.from("sales").delete().eq("id", id).select("id");
  if (error) return errorResponse(error.message);
  if (!data || data.length === 0) return errorResponse("Venta no encontrada", 404);
  revalidateTag("sales");
  return successResponse();
}
