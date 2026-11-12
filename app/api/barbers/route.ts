import { NextResponse } from "next/server";

import { successResponse, errorResponse, dbErrorResponse } from "@/lib/api/response";
import { parseBody } from "@/lib/api/parseBody";
import { BarberInsertSchema, BarberUpdateSchema, BarberDeleteSchema } from "@/lib/schemas";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { requireAdmin, requireBarberOrAdmin } from "@/lib/api/auth";
import { checkBarberLimit } from "@/lib/flags/server";
import { BARBER_PRIVATE_FIELDS, BARBER_PUBLIC_FIELDS } from "@/lib/repository/barbers";
import { revalidateTag } from "next/cache";

export async function GET(request: Request) {
  // Email y comisiones solo para staff; un visitante anónimo ve el perfil público
  const staff = await requireBarberOrAdmin();
  const fields = staff ? BARBER_PRIVATE_FIELDS : BARBER_PUBLIC_FIELDS;
  const allowedFilters = staff ? ["id", "email", "active"] : ["id"];

  const { searchParams } = new URL(request.url);
  let sbQuery = supabaseAdmin.from("barbers").select(fields);

  const filters = Array.from(searchParams.entries()).filter(([key]) => allowedFilters.includes(key));
  if (filters.length > 0) {
    filters.forEach(([key, value]) => {
      sbQuery = sbQuery.eq(key, value);
    });
    if (filters.length === 1) {
      const { data, error } = await sbQuery.single();
      if (error) return errorResponse("Barbero no encontrado", 404);
      return NextResponse.json(data);
    }
    sbQuery = sbQuery.order("id", { ascending: true });
    const { data, error } = await sbQuery;
    if (error) return dbErrorResponse(error, "barbers");
    return NextResponse.json(data);
  }

  const { data, error } = await sbQuery
    .eq("active", true)
    .order("id", { ascending: true });
  if (error) return dbErrorResponse(error, "barbers");
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("No autorizado", 401);

  const limitError = await checkBarberLimit();
  if (limitError) return limitError;

  const { data: body, error: bodyError } = await parseBody(request, BarberInsertSchema);
  if (bodyError) return bodyError;

  const insertPayload: Record<string, unknown> = {
    email: body.email,
    name: body.name,
    image: body.image ?? null,
    instagram: body.instagram ?? null,
    role: body.role || "barber",
  };
  if (body.commission !== undefined) insertPayload.commission = body.commission;
  if (body.sale_commission !== undefined) insertPayload.sale_commission = body.sale_commission;
  if (body.active !== undefined) insertPayload.active = body.active;

  const { data, error } = await supabaseAdmin
    .from("barbers")
    .insert(insertPayload)
    .select()
    .single();

  if (error) return dbErrorResponse(error, "barbers");
  revalidateTag("barbers");
  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("No autorizado", 401);

  const { data: body, error: bodyError } = await parseBody(request, BarberUpdateSchema);
  if (bodyError) return bodyError;

  const { id, ...values } = body;
  const { data, error } = await supabaseAdmin
    .from("barbers")
    .update(values)
    .eq("id", id)
    .select("id");

  if (error) return dbErrorResponse(error, "barbers");
  if (!data || data.length === 0) return errorResponse("Barbero no encontrado", 404);
  revalidateTag("barbers");
  return successResponse();
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("No autorizado", 401);

  const { data: body, error: bodyError } = await parseBody(request, BarberDeleteSchema);
  if (bodyError) return bodyError;

  const { data, error } = await supabaseAdmin
    .from("barbers")
    .delete()
    .eq("id", body.id)
    .select();
  if (error) return dbErrorResponse(error, "barbers");
  if (!data || data.length === 0) return errorResponse("Profesional no encontrado", 404);
  revalidateTag("barbers");
  return successResponse();
}
