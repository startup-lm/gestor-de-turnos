import { Appointment, AppointmentUpdates } from "../types/Appointment";

import { getBaseUrl } from "@/utils/getBaseUrl";
const BASE = getBaseUrl();

export async function getAppointmentsForBarberAndTime(barber_id: number,date: Date): Promise<Appointment[]> {
  const dateParam = date.toISOString().split("T")[0];
  const params = new URLSearchParams({ date: dateParam });
  if (barber_id !== 0) params.set("barber_id", barber_id.toString());

  try {
    const res = await fetch(`${BASE}/api/appointments?${params}`, {
      next: { tags: ["appointments", `appointments-${barber_id}-${dateParam}`] },
    });
    if (!res.ok) return [];
    const text = await res.text();
    if (!text.trim().startsWith("[")) return [];
    return JSON.parse(text);
  } catch (err) {
    console.error("getAppointmentsForBarberAndTime error:", err);
    return [];
  }
}

export async function createAppointment(input: {client: string;barber_id: number;date: Date;start_time: string;end_time: string;phone: string;service_id: number;created_by?: string;client_id?: number;}): Promise<{ success: boolean; id?: number }> {
  const { client, barber_id, date, start_time, end_time, phone, service_id, created_by, client_id } = input;
  const payload: Record<string, unknown> = {
    client,
    barber_id,
    date: date.toISOString().split("T")[0],
    start_time,
    end_time,
    phone,
    service_id,
    created_by,
  };
  if (client_id) payload.client_id = client_id;
  const res = await fetch(`${BASE}/api/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    next: { tags: ["appointments"] },
  });
  if (!res.ok) return { success: false };
  return res.json();
}

export async function deleteAppointment(id: number, deletedBy?: string): Promise<boolean> {
  const res = await fetch(`${BASE}/api/appointments`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, deleted_by: deletedBy }),
    next: { tags: ["appointments"] },
  });
  return res.ok;
}

export async function updateAppointment(appointmentId: number, updates: AppointmentUpdates): Promise<boolean> {
  const res = await fetch(`${BASE}/api/appointments`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ appointmentId, updates }),
    next: { tags: ["appointments"] },
  });
  return res.ok;
}

export async function getBarbersAppointmentsFromDates(barber_id: number,start_date: Date,end_date: Date): Promise<Appointment[]> {
  const params = new URLSearchParams({
    barber_id: barber_id.toString(),
    start_date: start_date.toISOString().split("T")[0],
    end_date: end_date.toISOString().split("T")[0],
  });
  try {
    const res = await fetch(`${BASE}/api/appointments?${params}`, {
      next: { tags: ["appointments"] },
    });
    if (!res.ok) return [];
    const text = await res.text();
    if (!text.trim().startsWith("[")) return [];
    return JSON.parse(text);
  } catch (err) {
    console.error("getBarbersAppointmentsFromDates error:", err);
    return [];
  }
}

export async function deleteAppointmentsByDate(input: {barber_id: number;date: Date;start_time: string;end_time: string;}): Promise<{ success: boolean }> {
  const { barber_id, date, start_time, end_time } = input;
  const payload = {
    barber_id,
    date: date.toISOString().split("T")[0],
    start_time,
    end_time,
  };
  const res = await fetch(`${BASE}/api/appointments/deleteByDate`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    next: { tags: ["appointments"] },
  });
  if (!res.ok) return { success: false };
  return res.json();
}

export async function getTotalAndRevenueForAllBarbers(start_date: Date,end_date: Date) {
  const params = new URLSearchParams({
    start_date: start_date.toISOString().split("T")[0],
    end_date: end_date.toISOString().split("T")[0],
  });
  try {
    const res = await fetch(`${BASE}/api/appointments/all?${params}`, {
      next: { tags: ["appointments"]},
    });
    if (!res.ok) return [];
    const text = await res.text();
    if (!text.trim().startsWith("[")) return [];
    return JSON.parse(text);
  } catch (err) {
    console.error("getTotalAndRevenueForAllBarbers error:", err);
    return [];
  }
}

export async function getAppointmentById(id: number): Promise<Appointment | null> {
  const params = new URLSearchParams({ id: id.toString() });
  try {
    const res = await fetch(`${BASE}/api/appointments?${params}`, {
      next: {tags: ["appointments"]},
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (!text.trim().startsWith("[")) return null;
    const data: Appointment[] = JSON.parse(text);
    return data.length > 0 ? data[0] : null;
  } catch (err) {
    console.error("getAppointmentById error:", err);
    return null;
  }
}
