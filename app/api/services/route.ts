import { NextResponse } from "next/server";

import { successResponse, errorResponse, dbErrorResponse } from "@/lib/api/response";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { requireAdmin } from "@/lib/api/auth";
import { removeStorageObjectByUrl } from "@/lib/storage/server";
import { revalidateTag } from "next/cache";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("services")
    .select()
    .order("name", { ascending: true });

  if (error) return dbErrorResponse(error, "services");
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("No autorizado", 401);

  const { name, description, price, image, duration } = await request.json();
  const { error } = await supabaseAdmin
    .from("services")
    .insert({
      name,
      description,
      price,
      image,
      duration: duration ? Number(duration) : 30,
    });

  if (error) return dbErrorResponse(error, "services");
  revalidateTag("services");
  return successResponse();
}

export async function PUT(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("No autorizado", 401);

  const { id, name, description, price, image, duration } = await request.json();
  const updateData: Record<string, unknown> = { name, description, price, image };
  if (duration !== undefined) updateData.duration = Number(duration);

  const { error } = await supabaseAdmin
    .from("services")
    .update(updateData)
    .eq("id", id);

  if (error) return dbErrorResponse(error, "services");
  revalidateTag("services");
  return successResponse();
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("No autorizado", 401);

  const { id } = await request.json();
  const { data: product, error: fetchError } = await supabaseAdmin
    .from("services")
    .select("image")
    .eq("id", id)
    .single();
  if (fetchError) return dbErrorResponse(fetchError, "services");
  if (product?.image) await removeStorageObjectByUrl("services", product.image);
  const  { data, error } = await supabaseAdmin
    .from("services")
    .delete()
    .eq("id", id)
    .select();
  if (error) return dbErrorResponse(error, "services");
  if (!data || data.length === 0) return errorResponse("no delete", 404);
  revalidateTag("services");
  return successResponse();
}