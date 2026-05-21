/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api/response";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { createSupabaseServerClient } from "@/lib/supabase/supabaseServer";
import { requireBarberOrAdmin } from "@/lib/api/auth";
import { rateLimit } from "@/lib/api/rateLimit";
import { revalidateTag } from "next/cache";
import {
  AppointmentInsertSchema,
  AppointmentPutSchema,
  AppointmentPatchSchema,
  AppointmentDeleteSchema,
} from "@/lib/schemas";

export async function GET(request: Request) {
  // Verificar si es barbero o admin para devolver datos reales o enmascarados
  const staff = await requireBarberOrAdmin();
  const isAuthorized = staff !== null;

  const { searchParams } = new URL(request.url);
  let query = supabaseAdmin
    .from("appointments")
    .select(`*, barbers(name), services(name)`)
    .is("deleted_at", null);
  for (const [key, value] of searchParams.entries()) {
    if (key === "start_date") {
      query = query.gte("date", value);
    } else if (key === "end_date") {
      query = query.lte("date", value);
    } else if (key === "date") {
      query = query.eq("date", value);
    } else if (key === "barber_id" && value === "0") {
      // Omitir filtro para traer todos los turnos si no hay preferencia (Cualquier Barbero)
    } else {
      query = query.eq(key, value);
    }
  }
  const { data, error } = await query.order("start_time", { ascending: true });
  if (error) return errorResponse(error.message);
  const formatted = data.map(item => ({
    ...item,
    start_time: item.start_time?.slice(0, 5) ?? item.start_time,
    end_time: item.end_time?.slice(0, 5) ?? item.end_time,
    // Enmascarar información sensible para usuarios no autenticados
    client: isAuthorized ? item.client : "Ocupado",
    phone: isAuthorized ? item.phone : null,
    price: isAuthorized ? item.price : null,
    payment_method: isAuthorized ? item.payment_method : null,
    created_by: isAuthorized ? item.created_by : null,
    deleted_by: isAuthorized ? item.deleted_by : null,
  }));
  return NextResponse.json(formatted);
}

export async function POST(request: Request) {
  // 1. Verificar si es personal de la barbería para exceptuarlo del control de tasa
  const staff = await requireBarberOrAdmin();
  const isStaff = staff !== null;

  if (!isStaff) {
    // 2. Obtener IP del cliente
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || 
               request.headers.get("x-real-ip") || 
               "127.0.0.1";

    // 3. Aplicar límite de 10 turnos por minuto (60000 ms) para usuarios anónimos
    const limitResult = rateLimit(ip, 10, 60000);

    if (!limitResult.success) {
      return errorResponse(
        "Has superado el límite de reservas permitido por minuto. Por favor, aguarda un instante e intenta nuevamente.",
        429
      );
    }
  }

  const body = await request.json();
  const parsed = AppointmentInsertSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message, 400);
  }

  const { client, barber_id, date, start_time, end_time, phone, service_id, created_by, client_id, type } = parsed.data;

  const insertPayload: Record<string, unknown> = {
    client,
    barber_id,
    date: date.split("T")[0],
    start_time: `${start_time}:00`,
    end_time: `${end_time}:00`,
    phone: phone ?? "",
    service_id,
    type,
    created_at: new Date().toISOString(),
  };
  if (created_by) insertPayload.created_by = created_by;
  if (client_id) insertPayload.client_id = client_id;
  const { data, error } = await supabaseAdmin
    .from("appointments")
    .insert(insertPayload)
    .select("id");

  if (error) return errorResponse(error.message);
  revalidateTag("appointments");
  revalidateTag(`appointments-${barber_id}-${date.split("T")[0]}`);
  return NextResponse.json({ success: true, id: data?.[0]?.id });
}

export async function PUT(request: Request) {
  const staff = await requireBarberOrAdmin();
  if (!staff) return errorResponse("No autorizado", 401);

  const body = await request.json();
  const parsed = AppointmentPutSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse("Datos inválidos para actualizar el turno", 400);
  }

  const { appointmentId, isPaid, price, payment_method } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("appointments")
    .update({ paid: isPaid, price, payment_method })
    .eq("id", appointmentId)
    .select();

  if (error) return errorResponse(error.message);
  
  revalidateTag("appointments");
  if (data && data.length > 0) {
    const updated = data[0];
    if (updated.barber_id && updated.date) {
      revalidateTag(`appointments-${updated.barber_id}-${updated.date}`);
    }
  }
  return successResponse();
}

export async function DELETE(request: Request) {
  const staff = await requireBarberOrAdmin();
  if (!staff) return errorResponse("No autorizado", 401);

  const body = await request.json();
  const parsed = AppointmentDeleteSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse("Datos inválidos para eliminar el turno", 400);
  }

  const { id, deleted_by } = parsed.data;
  const updatePayload: any = { deleted_at: new Date().toISOString() };
  if (deleted_by) updatePayload.deleted_by = deleted_by;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("appointments")
    .update(updatePayload)
    .eq("id", id)
    .select();
  if (error) return errorResponse(error.message);
  if (!data || data.length === 0) return errorResponse("No existe ese número de turno", 404);
  
  const deletedAppt = data[0];
  revalidateTag("appointments");
  if (deletedAppt.barber_id && deletedAppt.date) {
    revalidateTag(`appointments-${deletedAppt.barber_id}-${deletedAppt.date}`);
  }
  
  return successResponse();
}

export async function PATCH(request: Request) {
  const staff = await requireBarberOrAdmin();
  if (!staff) return errorResponse("No autorizado", 401);

  const body = await request.json();
  const parsed = AppointmentPatchSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse("Datos inválidos para modificar el turno", 400);
  }

  const { appointmentId, updates } = parsed.data;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("appointments")
    .update(updates)
    .eq("id", appointmentId)
    .select();

  if (error) return errorResponse(error.message);
  revalidateTag("appointments");
  if (data && data.length > 0) {
    const updated = data[0];
    if (updated.barber_id && updated.date) {
      revalidateTag(`appointments-${updated.barber_id}-${updated.date}`);
    }
  }
  return successResponse();
}
