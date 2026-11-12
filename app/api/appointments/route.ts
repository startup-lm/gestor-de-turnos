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
import { fetchAllRows } from "@/lib/supabase/fetchAllRows";
import { addDaysToDay } from "@/lib/dates/argentina";
import {
  addMinutesToTime,
  isPastInArgentina,
  isWithinBusinessHours,
  OVERLAP_ERROR_MESSAGE,
} from "@/lib/appointments/publicBooking";

export async function GET(request: Request) {
  // Verificar si es barbero o admin para devolver datos reales o filtrados
  const staff = await requireBarberOrAdmin();
  const isAuthorized = staff !== null;

  const { searchParams } = new URL(request.url);

  if (!isAuthorized) {
    const dateParam = searchParams.get("date");
    const startDateParam = searchParams.get("start_date");
    const endDateParam = searchParams.get("end_date");
    const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

    let isValidRange = false;
    if (dateParam && DATE_REGEX.test(dateParam)) {
      isValidRange = true;
    } else if (
      startDateParam &&
      endDateParam &&
      DATE_REGEX.test(startDateParam) &&
      DATE_REGEX.test(endDateParam) &&
      startDateParam <= endDateParam &&
      endDateParam <= addDaysToDay(startDateParam, 62)
    ) {
      isValidRange = true;
    }

    if (!isValidRange) {
      return errorResponse("Indicá un rango de fechas válido", 400);
    }

    let query = supabaseAdmin
      .from("appointments")
      .select("id, barber_id, service_id, date, start_time, end_time, type")
      .is("deleted_at", null);

    if (dateParam) {
      query = query.eq("date", dateParam);
    } else if (startDateParam && endDateParam) {
      query = query.gte("date", startDateParam).lte("date", endDateParam);
    }

    const barberId = searchParams.get("barber_id");
    if (barberId && barberId !== "0") {
      query = query.eq("barber_id", barberId);
    }

    const { data, error } = await query
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) return dbErrorResponse(error, "appointments.get");

    const formatted = (data ?? []).map((item) => ({
      id: item.id,
      barber_id: item.barber_id,
      service_id: item.service_id,
      date: item.date,
      start_time: item.start_time?.slice(0, 5) ?? item.start_time,
      end_time: item.end_time?.slice(0, 5) ?? item.end_time,
      type: item.type,
    }));
    return NextResponse.json(formatted);
  }

  // Staff: mismos filtros que hoy y mismo select con joins, pero traído con fetchAllRows, ordenado por date, start_time e id
  const { data, error } = await fetchAllRows((from, to) => {
    let pageQuery = supabaseAdmin
      .from("appointments")
      .select(`*, barbers(name), services(name), arca_invoices(*)`)
      .is("deleted_at", null);

    for (const [key, value] of searchParams.entries()) {
      if (key === "start_date") {
        pageQuery = pageQuery.gte("date", value);
      } else if (key === "end_date") {
        pageQuery = pageQuery.lte("date", value);
      } else if (key === "date") {
        pageQuery = pageQuery.eq("date", value);
      } else if (key === "barber_id") {
        if (value !== "0") pageQuery = pageQuery.eq("barber_id", value);
      } else if (key === "id" || key === "service_id") {
        pageQuery = pageQuery.eq(key, value);
      }
    }

    return pageQuery
      .order("date", { ascending: true })
      .order("start_time", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to);
  });

  if (error) return dbErrorResponse(error, "appointments.get");

  const formatted = (data ?? []).map((item: any) => ({
    ...item,
    start_time: item.start_time?.slice(0, 5) ?? item.start_time,
    end_time: item.end_time?.slice(0, 5) ?? item.end_time,
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
  const appointmentDate = date.split("T")[0];

  let finalType = type ?? "appointment";
  let finalEndTime = end_time;

  if (!isStaff) {
    // 1. Forzar type = "appointment"
    finalType = "appointment";

    // 2. Antes de cualquier consulta, chequeo de pasado con hora argentina
    if (isPastInArgentina(appointmentDate, start_time)) {
      return errorResponse("No es posible reservar turnos en fechas u horarios pasados.", 400);
    }

    // 3. Leer en paralelo con Promise.all
    const [serviceRes, barberRes, hoursRes] = await Promise.all([
      supabaseAdmin.from("services").select("id, duration").eq("id", service_id).maybeSingle(),
      supabaseAdmin.from("barbers").select("id, active").eq("id", barber_id).maybeSingle(),
      supabaseAdmin.from("business_hours_global").select("open_time, close_time, closed_days").eq("id", 1).maybeSingle(),
    ]);

    if (serviceRes.error) return dbErrorResponse(serviceRes.error, "appointments.post");
    if (barberRes.error) return dbErrorResponse(barberRes.error, "appointments.post");
    if (hoursRes.error) return dbErrorResponse(hoursRes.error, "appointments.post");

    if (!serviceRes.data) {
      return errorResponse("El servicio elegido no existe", 400);
    }
    if (!barberRes.data || barberRes.data.active !== true) {
      return errorResponse("El profesional elegido no está disponible", 400);
    }

    // 4. end_time del anónimo = start_time + duration minutos
    const duration = Number(serviceRes.data.duration ?? 30);
    const computedEndTime = addMinutesToTime(start_time, duration);
    if (!computedEndTime) {
      return errorResponse("El horario elegido no es válido", 400);
    }
    finalEndTime = computedEndTime;

    // 5. Validar horario de local si hay fila de horarios
    if (hoursRes.data) {
      if (!isWithinBusinessHours(appointmentDate, start_time, hoursRes.data)) {
        return errorResponse("El local no atiende en ese horario", 400);
      }
    }
  }

  // Normalizar teléfono canónico (+549...)
  let canonicalPhone = phone ?? "";
  if (phone && phone !== "0000000000") {
    const norm = normalizePhone(phone);
    if (norm.isValid) {
      canonicalPhone = norm.e164;
    }
  }

  let finalClientId = isStaff ? client_id : undefined;

  // Asegurar registro de cliente en tabla clients desde el servidor
  if (!finalClientId && client && canonicalPhone && canonicalPhone !== "0000000000" && finalType !== "block") {
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

  const newStart = `${start_time}:00`;
  const newEnd = `${finalEndTime}:00`;

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
    return errorResponse(OVERLAP_ERROR_MESSAGE, 400);
  }

  const insertPayload: Record<string, unknown> = {
    client,
    barber_id,
    date: appointmentDate,
    start_time: newStart,
    end_time: newEnd,
    phone: canonicalPhone,
    service_id,
    type: finalType,
    created_at: new Date().toISOString(),
  };
  if (isStaff && created_by) insertPayload.created_by = created_by;
  if (finalClientId) insertPayload.client_id = finalClientId;
  const { data, error } = await supabaseAdmin
    .from("appointments")
    .insert(insertPayload)
    .select("id");

  if (error) {
    if ((error as any).code === "23P01") {
      return errorResponse(OVERLAP_ERROR_MESSAGE, 400);
    }
    return dbErrorResponse(error, "appointments");
  }
  revalidateTag("appointments");
  revalidateTag(`appointments-${barber_id}-${appointmentDate}`);
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

  if (error) {
    if ((error as any).code === "23P01") {
      return errorResponse(OVERLAP_ERROR_MESSAGE, 400);
    }
    return dbErrorResponse(error, "appointments");
  }
  revalidateTag("appointments");
  if (data && data.length > 0) {
    const updated = data[0];
    if (updated.barber_id && updated.date) {
      revalidateTag(`appointments-${updated.barber_id}-${updated.date}`);
    }
  }
  return successResponse();
}
