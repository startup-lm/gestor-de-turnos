import { NextResponse } from "next/server";

import { successResponse, errorResponse } from "@/lib/api/response";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { deleteImage } from "@/lib/repository/storage";
import { revalidateTag } from "next/cache";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select()
    .order("name", { ascending: true });

  if (error) return errorResponse(error.message);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const { name, description, price, image } = await request.json();
  const { error } = await supabaseAdmin
    .from("products")
    .insert({ name, description, price, image });

  if (error) return errorResponse(error.message);
  revalidateTag("products");
  return successResponse();
}

export async function PUT(request: Request) {
  const { id, name, description, price, image } = await request.json();
  const { error } = await supabaseAdmin
    .from("products")
    .update({ name, description, price, image })
    .eq("id", id);

  if (error) return errorResponse(error.message);
  revalidateTag("products");
  return successResponse();
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  const { data: product, error: fetchError } = await supabaseAdmin
    .from("products")
    .select("image")
    .eq("id", id)
    .single();
  if (fetchError) return errorResponse(fetchError.message);
  if (product?.image) await deleteImage("products", product.image);
  const { data, error }  = await supabaseAdmin
    .from("products")
    .delete()
    .eq("id", id)
    .select();
  if (error) return errorResponse(error.message);
  if (!data || data.length === 0) return errorResponse("no delete", 404);
  revalidateTag("products");
  return successResponse();
}