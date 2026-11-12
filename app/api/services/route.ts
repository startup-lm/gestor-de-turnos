import { NextResponse } from "next/server";

import { successResponse, errorResponse, dbErrorResponse } from "@/lib/api/response";
import { parseBody } from "@/lib/api/parseBody";
import { ServiceInsertSchema, ServiceUpdateSchema, ServiceDeleteSchema } from "@/lib/schemas";
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

  const { data: body, error: bodyError } = await parseBody(request, ServiceInsertSchema);
  if (bodyError) return bodyError;

  const { error } = await supabaseAdmin
    .from("services")
    .insert({
      name: body.name,
      description: body.description ?? "",
      price: body.price,
      image: body.image ?? null,
      duration: body.duration ?? 30,
    });

  if (error) return dbErrorResponse(error, "services");
  revalidateTag("services");
  return successResponse();
}

export async function PUT(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("No autorizado", 401);

  const { data: body, error: bodyError } = await parseBody(request, ServiceUpdateSchema);
  if (bodyError) return bodyError;

  const { id, ...rest } = body;
  const updateData: Record<string, unknown> = {};
  if (rest.name !== undefined) updateData.name = rest.name;
  if (rest.description !== undefined) updateData.description = rest.description;
  if (rest.price !== undefined) updateData.price = rest.price;
  if (rest.image !== undefined) updateData.image = rest.image;
  if (rest.duration !== undefined) updateData.duration = rest.duration;

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

  const { data: body, error: bodyError } = await parseBody(request, ServiceDeleteSchema);
  if (bodyError) return bodyError;

  const { id } = body;
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