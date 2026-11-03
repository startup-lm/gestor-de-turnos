/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { successResponse, errorResponse, dbErrorResponse } from "@/lib/api/response";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { requireBarberOrAdmin } from "@/lib/api/auth";
import { checkRateLimit, getClientIp } from "@/lib/api/rateLimit";
import { revalidateTag } from "next/cache";
import { canModify } from "@/lib/api/ownership";
import { getBarberRates, lockedByPayoutMessage } from "@/lib/finance/barberRates";
import { currentShiftId, closedShiftLock } from "@/lib/finance/openShift";
import {
  AppointmentInsertSchema,
  AppointmentPatchSchema,
  AppointmentDeleteSchema,
} from "@/lib/schemas";
import { normalizePhone } from "@/utils/phone";

export async function GET(request: Request) {
  // Verificar si es barbero o admin para devolver datos reales o enmascarados
  const staff = await requireBarberOrAdmin();
  const isAuthorized = staff !== null;

  const { searchParams } = new URL(request.url);
  let query = supabaseAdmin
    .from("appointments")
    .select(`*, barbers(name), services(name), arca_invoices(*)`)
    .is("deleted_at", null);
  // Solo filtros conocidos: un filtro libre permitiría a un anónimo buscar por teléfono o cliente
  for (const [key, value] of searchParams.entries()) {
    if (key === "start_date") {
      query = query.gte("date", value);
    } else if (key === "end_date") {
      query = query.lte("date", value);
    } else if (key === "date") {
      query = query.eq("date", value);
    } else if (key === "barber_id") {
      // barber_id=0 significa "Cualquier Barbero": no se filtra
      if (value !== "0") query = query.eq("barber_id", value);
    } else if (key === "id" || key === "service_id") {
      query = query.eq(key, value);
    }
  }
  const { data, error } = await query
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });
  if (error) return dbErrorResponse(error, "appointments.get");
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
    client_id: isAuthorized ? item.client_id : null,
    paid: isAuthorized ? item.paid : false,
    arca_invoice_id: isAuthorized ? item.arca_invoice_id : null,
    arca_invoices: isAuthorized ? item.arca_invoices : null,
  }));
  return NextResponse.json(formatted);
}

export async function POST(request: Request) {
  // 1. Verificar si es personal de la barbería para exceptuarlo del control de tasa
  const staff = await requireBarberOrAdmin();
  const isStaff = staff !== null;

  if (!isStaff) {
    // 2. Obtener IP del cliente
    const ip = getClientIp(request);

    // 3. Aplicar límite de 10 turnos por minuto (60000 ms) para usuarios anónimos
    const limitResult = await checkRateLimit(`create-appointment-${ip}`, 10, 60000);

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

  // Normalizar teléfono canónico (+549...)
  let canonicalPhone = phone ?? "";
  if (phone && phone !== "0000000000") {
    const norm = normalizePhone(phone);
    if (norm.isValid) {
      canonicalPhone = norm.e164;
    }
  }

  let finalClientId = client_id;

  // Asegurar registro de cliente en tabla clients desde el servidor
  if (!finalClientId && client && canonicalPhone && canonicalPhone !== "0000000000" && type !== "block") {
    try {
      const today = new Date().toISOString().split("T")[0];
      const norm = normalizePhone(canonicalPhone);
      const { data: existingClient } = await supabaseAdmin
        .from("clients")
        .select("id")
        .or(`phone.eq.${canonicalPhone},phone.eq.${norm.national}`)
        .maybeSingle();

      if (existingClient) {
        finalClientId = existingClient.id;
        await supabaseAdmin
          .from("clients")
          .update({ last_visit_date: today, phone: canonicalPhone })
          .eq("id", existingClient.id);
      } else {
        const { data: newClient } = await supabaseAdmin
          .from("clients")
          .insert({ name: client, phone: canonicalPhone, last_visit_date: today })
          .select("id")
          .single();
        if (newClient) finalClientId = newClient.id;
      }
    } catch (err) {
      console.error("Error sincronizando cliente en creación de turno:", err);
    }
  }

  const appointmentDate = date.split("T")[0];
  const newStart = `${start_time}:00`;
  const newEnd = `${end_time}:00`;

  // Validar que clientes anónimos no puedan reservar turnos en el pasado
  if (!isStaff) {
    const apptDateTime = new Date(`${appointmentDate}T${newStart}`);
    if (apptDateTime.getTime() < Date.now()) {
      return errorResponse("No es posible reservar turnos en fechas u horarios pasados.", 400);
    }
  }

  // Validar que no se solape con otro turno activo del mismo barbero
  const { data: overlapping, error: overlapError } = await supabaseAdmin
    .from("appointments")
    .select("id")
    .eq("barber_id", barber_id)
    .eq("date", appointmentDate)
    .is("deleted_at", null)
    .lt("start_time", newEnd)
    .gt("end_time", newStart)
    .limit(1);

  if (overlapError) {
    return dbErrorResponse(overlapError, "appointments");
  }

  if (overlapping && overlapping.length > 0) {
    return errorResponse("El horario seleccionado coincide o se solapa con otro turno ya agendado.", 400);
  }

  const insertPayload: Record<string, unknown> = {
    client,
    barber_id,
    date: appointmentDate,
    start_time: newStart,
    end_time: newEnd,
    phone: canonicalPhone,
    service_id,
    type,
    created_at: new Date().toISOString(),
  };
  if (created_by) insertPayload.created_by = created_by;
  if (finalClientId) insertPayload.client_id = finalClientId;
  const { data, error } = await supabaseAdmin
    .from("appointments")
    .insert(insertPayload)
    .select("id");

  if (error) return dbErrorResponse(error, "appointments");
  revalidateTag("appointments");
  revalidateTag(`appointments-${barber_id}-${date.split("T")[0]}`);
  return NextResponse.json({ success: true, id: data?.[0]?.id });
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

  // Validar existencia y estado del turno antes de eliminar
  const { data: appt, error: findError } = await supabaseAdmin
    .from("appointments")
    .select("id, barber_id, paid, arca_invoice_id, payout_id, type")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (findError) return dbErrorResponse(findError, "appointments");
  if (!appt) return errorResponse("No existe ese número de turno o ya fue eliminado", 404);
  if (!canModify(staff, appt.barber_id)) {
    return errorResponse("Solo podés eliminar tus propios turnos", 403);
  }

  // Un bloqueo de horario no es un turno de cliente, se puede desbloquear normalmente
  if (appt.type !== "block") {
    if (appt.payout_id) {
      return errorResponse(lockedByPayoutMessage("turno", appt.payout_id), 409);
    }
    if (appt.arca_invoice_id) {
      return errorResponse(
        `No es posible eliminar un turno que ya posee comprobante fiscal emitido ante ARCA (Factura #${appt.arca_invoice_id}).`,
        400
      );
    }

    if (appt.paid) {
      return errorResponse(
        "No es posible eliminar un turno que ya fue cobrado. Primero debés revertir el cobro si corresponde.",
        400
      );
    }
  }

  const updatePayload: any = { deleted_at: new Date().toISOString() };
  if (deleted_by) updatePayload.deleted_by = deleted_by;

  const { data, error } = await supabaseAdmin
    .from("appointments")
    .update(updatePayload)
    .eq("id", id)
    .select();
  if (error) return dbErrorResponse(error, "appointments");
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
  // Validar si el turno ya cuenta con comprobante fiscal emitido
  const { data: existingAppt, error: findError } = await supabaseAdmin
    .from("appointments")
    .select("id, barber_id, paid, arca_invoice_id, payout_id, shift_id")
    .eq("id", appointmentId)
    .is("deleted_at", null)
    .maybeSingle();

  if (findError) return dbErrorResponse(findError, "appointments");
  if (!existingAppt) return errorResponse("No existe ese número de turno o ya fue eliminado", 404);
  if (!canModify(staff, existingAppt.barber_id)) {
    return errorResponse("Solo podés modificar tus propios turnos", 403);
  }

  if (existingAppt.arca_invoice_id) {
    return errorResponse(
      `No es posible editar un turno que ya posee comprobante fiscal emitido ante ARCA (Factura #${existingAppt.arca_invoice_id}).`,
      400
    );
  }
  if (existingAppt.payout_id) {
    return errorResponse(lockedByPayoutMessage("turno", existingAppt.payout_id), 409);
  }
  const shiftLock = await closedShiftLock(existingAppt.shift_id);
  if (shiftLock) return shiftLock;

  // % de comisión congelado: se fija al cobrar (o si un turno cobrado cambia de barbero)
  // y se borra al revertir el cobro
  const willBePaid = updates.paid ?? existingAppt.paid;
  const barberChanges = updates.barber_id !== undefined && updates.barber_id !== existingAppt.barber_id;
  let commissionUpdate: { commission_rate?: number | null } = {};
  if (!willBePaid) {
    if (existingAppt.paid) commissionUpdate = { commission_rate: null };
  } else if (updates.paid === true || barberChanges) {
    const { rates, error: ratesError } = await getBarberRates(updates.barber_id ?? existingAppt.barber_id);
    if (ratesError) return dbErrorResponse(ratesError, "appointments");
    if (!rates) return errorResponse("Profesional no encontrado", 404);
    commissionUpdate = { commission_rate: rates.commission };
  }

  // Caja: el cobro entra en el período en curso; al revertirlo, sale de la caja
  let shiftUpdate: { shift_id?: number | null } = {};
  if (!willBePaid && existingAppt.paid && existingAppt.shift_id) {
    shiftUpdate = { shift_id: null };
  } else if (updates.paid === true && !existingAppt.paid) {
    const { shiftId, error: shiftError } = await currentShiftId(staff.user.email!);
    if (shiftError) return dbErrorResponse(shiftError, "appointments.shift");
    shiftUpdate = { shift_id: shiftId };
  }

  const { data, error } = await supabaseAdmin
    .from("appointments")
    .update({ ...updates, ...commissionUpdate, ...shiftUpdate })
    .eq("id", appointmentId)
    .select();

  if (error) return dbErrorResponse(error, "appointments");
  revalidateTag("appointments");
  if (data && data.length > 0) {
    const updated = data[0];
    if (updated.barber_id && updated.date) {
      revalidateTag(`appointments-${updated.barber_id}-${updated.date}`);
    }
  }
  return successResponse();
}
