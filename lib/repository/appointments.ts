import { Appointment, AppointmentUpdates } from "../types/Appointment";

import { getBaseUrl } from "@/utils/getBaseUrl";
const BASE = getBaseUrl();


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

export async function deleteAppointment(
  id: number,
  deletedBy?: string
): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`${BASE}/api/appointments`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, deleted_by: deletedBy }),
    next: { tags: ["appointments"] },
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    return { success: false, error: json?.error ?? "Error al eliminar el turno" };
  }
  return { success: true };
}

export async function updateAppointment(
  appointmentId: number,
  updates: AppointmentUpdates
): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`${BASE}/api/appointments`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ appointmentId, updates }),
    next: { tags: ["appointments"] },
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    return { success: false, error: json?.error ?? "Error al editar el turno" };
  }
  return { success: true };
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


const formatLocalDate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export interface TotalAndRevenueResponse {
  barberTotals: { barberId: number; totalAppt: number; totalRevenue: number }[];
  paymentMethodTotals: Record<string, number>;
}

export async function getTotalAndRevenueForAllBarbers(start_date: Date, end_date: Date): Promise<TotalAndRevenueResponse> {
  const params = new URLSearchParams({
    start_date: formatLocalDate(start_date),
    end_date: formatLocalDate(end_date),
  });
  try {
    const res = await fetch(`${BASE}/api/appointments/all?${params}`, {
      next: { tags: ["appointments"] },
    });
    if (!res.ok) return { barberTotals: [], paymentMethodTotals: {} };
    const text = await res.text();
    if (!text.trim().startsWith("{")) return { barberTotals: [], paymentMethodTotals: {} };
    return JSON.parse(text);
  } catch (err) {
    console.error("getTotalAndRevenueForAllBarbers error:", err);
    return { barberTotals: [], paymentMethodTotals: {} };
  }
}

export async function getAppointmentById(id: number): Promise<Appointment | null> {
  if (typeof window === "undefined") {
    try {
      const { supabaseAdmin } = await import("@/lib/supabase/supabaseAdmin");
      const { data, error } = await supabaseAdmin
        .from("appointments")
        .select("*, barbers(name), services(name), arca_invoices(*)")
        .eq("id", id)
        .is("deleted_at", null)
        .single();
      if (error || !data) return null;
      return {
        ...data,
        start_time: data.start_time?.slice(0, 5) ?? data.start_time,
        end_time: data.end_time?.slice(0, 5) ?? data.end_time,
      } as Appointment;
    } catch (e) {
      console.error("getAppointmentById server query error:", e);
      return null;
    }
  }

  const params = new URLSearchParams({ id: id.toString() });
  try {
    const res = await fetch(`${BASE}/api/appointments?${params}`, {
      next: { tags: ["appointments"] },
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (!text.trim().startsWith("[")) return null;
    const data: Appointment[] = JSON.parse(text);
    return data.length > 0 ? data[0] : null;
  } catch (err) {
    console.error("getAppointmentById client error:", err);
    return null;
  }
}

