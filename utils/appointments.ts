import { Appointment } from "@/lib/types/Appointment";
import { CalendarEvent } from "@/lib/types/CalendarEvent";

type AppointmentSlotsConfig = {
  openTime?: string | null;
  closeTime?: string | null;
  stepMinutes?: number;
  breakStart?: string | null;
  breakEnd?: string | null;
};

const DEFAULT_OPEN_TIME = "10:30";
const DEFAULT_CLOSE_TIME = "20:00";
const DEFAULT_STEP_MINUTES = 30;
const DEFAULT_BREAK_START = "14:00";
const DEFAULT_BREAK_END = "15:00";

const parseTimeToMinutes = (value: string) => {
  const [hoursRaw, minutesRaw] = value.split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

const formatMinutes = (totalMinutes: number) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

export function generateAllAppointments(config: AppointmentSlotsConfig = {}) {
  const openTime = config.openTime ?? DEFAULT_OPEN_TIME;
  const closeTime = config.closeTime ?? DEFAULT_CLOSE_TIME;
  const stepMinutes = config.stepMinutes ?? DEFAULT_STEP_MINUTES;
  const hasBreakConfig = config.breakStart !== undefined || config.breakEnd !== undefined;
  const breakStart = hasBreakConfig ? config.breakStart : DEFAULT_BREAK_START;
  const breakEnd = hasBreakConfig ? config.breakEnd : DEFAULT_BREAK_END;
  if (stepMinutes <= 0) return [];
  const startMinutes = parseTimeToMinutes(openTime);
  const endMinutes = parseTimeToMinutes(closeTime);
  const breakStartMinutes = breakStart ? parseTimeToMinutes(breakStart) : null;
  const breakEndMinutes = breakEnd ? parseTimeToMinutes(breakEnd) : null;
  if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
    return [];
  }
  const horarios: string[] = [];
  for (let current = startMinutes; current < endMinutes; current += stepMinutes) {
    const isBreak =
      breakStartMinutes !== null &&
      breakEndMinutes !== null &&
      breakEndMinutes > breakStartMinutes &&
      current >= breakStartMinutes &&
      current < breakEndMinutes;
    if (isBreak) continue;
    horarios.push(formatMinutes(current));
  }
  return horarios;
}

export const transformAppointmentsToEvents = (appointments: Appointment[],role: string): CalendarEvent[] => {
  return appointments.map(appt => {
    const rawStart = new Date(`${appt.date}T${appt.start_time}`);
    const rawEnd   = new Date(`${appt.date}T${appt.end_time}`);
    const start = new Date(rawStart.getTime() + 60 * 1000);
    const end   = new Date(rawEnd.getTime() - 60 * 1000);

    return {
      id: appt.id,
      title: role === 'guest' ? 'Reservado' : appt.client,
      start,
      end,
      paid: appt.paid,
      isAppt: appt.phone !== "0000000000",
      barber_id: appt.barber_id
    };
  });
};
