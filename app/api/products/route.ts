import { NextResponse } from "next/server";

import { successResponse, errorResponse, dbErrorResponse } from "@/lib/api/response";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { requireAdmin } from "@/lib/api/auth";
import { removeStorageObjectByUrl } from "@/lib/storage/server";
import { revalidateTag } from "next/cache";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select()
    .order("name", { ascending: true });

  if (error) return dbErrorResponse(error, "products");
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("No autorizado", 401);

  const { name, description, price, image, stock } = await request.json();
  const { error } = await supabaseAdmin
    .from("products")
    .insert({
      name,
      description,
      price,
      image,
      stock: stock ? Number(stock) : 0,
    });

  if (error) return dbErrorResponse(error, "products");
  revalidateTag("products");
  return successResponse();
}

export async function PUT(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("No autorizado", 401);

  const { id, name, description, price, image, stock } = await request.json();
  const updateData: Record<string, unknown> = { name, description, price, image };
  if (stock !== undefined) updateData.stock = Number(stock);

  const { error } = await supabaseAdmin
    .from("products")
    .update(updateData)
    .eq("id", id);

  if (error) return dbErrorResponse(error, "products");
  revalidateTag("products");
  return successResponse();
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("No autorizado", 401);

  const { id } = await request.json();
  const { data: product, error: fetchError } = await supabaseAdmin
    .from("products")
    .select("image")
    .eq("id", id)
    .single();
  if (fetchError) return dbErrorResponse(fetchError, "products");
  if (product?.image) await removeStorageObjectByUrl("products", product.image);
  const { data, error }  = await supabaseAdmin
    .from("products")
    .delete()
    .eq("id", id)
    .select();
  if (error) return dbErrorResponse(error, "products");
  if (!data || data.length === 0) return errorResponse("no delete", 404);
  revalidateTag("products");
  return successResponse();
}