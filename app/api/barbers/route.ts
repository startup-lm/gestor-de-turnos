import { NextResponse } from "next/server";

import { successResponse, errorResponse } from "@/lib/api/response";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { requireAdmin } from "@/lib/api/auth";
import { revalidateTag } from "next/cache";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fields = "id, email, name, image, instagram, role, active, commission, sale_commission";
  let sbQuery = supabaseAdmin.from("barbers").select(fields);

  const filters = Array.from(searchParams.entries());
  if (filters.length > 0) {
    filters.forEach(([key, value]) => {
      sbQuery = sbQuery.eq(key, value);
    });
    if (filters.length === 1) {
      const { data, error } = await sbQuery.single();
      if (error) return errorResponse(error.message, 404);
      return NextResponse.json(data);
    }
    sbQuery = sbQuery.order("id", { ascending: true });
    const { data, error } = await sbQuery;
    if (error) return errorResponse(error.message);
    return NextResponse.json(data);
  }

  const { data, error } = await sbQuery
    .eq("active", true)
    .order("id", { ascending: true });
  if (error) return errorResponse(error.message);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("No autorizado", 401);

  const { email, name, image, instagram, role } = await request.json();
  const { data, error } = await supabaseAdmin
    .from("barbers")
    .insert({ email, name, image, instagram, role })
    .single();

  if (error) return errorResponse(error.message);
  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("No autorizado", 401);

  const { id, ...values } = await request.json();
  const { data, error } = await supabaseAdmin
    .from("barbers")
    .update(values)
    .eq("id", id)
    .select("id");

  if (error) return errorResponse(error.message);
  if (!data || data.length === 0) return errorResponse("Barbero no encontrado", 404);
  revalidateTag("barbers");
  return successResponse();
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("No autorizado", 401);

  const { id }: { id: number } = await request.json();
  const { data, error } = await supabaseAdmin
    .from("barbers")
    .delete()
    .eq("id", id)
    .select();
  if (error) return errorResponse(error.message);
  if (!data || data.length === 0) return errorResponse("No existe ese número de turno", 404);
  revalidateTag("barbers");
  return successResponse();
}