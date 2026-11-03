import type { Appointment } from "@/lib/types/Appointment";
import { todayInArgentina } from "@/lib/dates/argentina";

type PastUnpaidFields = Pick<Appointment, "date" | "end_time" | "paid" | "type">;

/** Hora actual en Argentina como "HH:MM:SS" (UTC−3 fijo, igual que `todayInArgentina`). */
function nowTimeInArgentina(now: Date): string {
  return new Date(now.getTime() - 3 * 3600 * 1000).toISOString().slice(11, 19);
}

/**
 * Un turno que ya terminó y no se cobró. Mientras no exista el estado "No asistió",
 * también cuenta así el cliente que no vino.
 */
export function isPastUnpaid(appt: PastUnpaidFields, now: Date = new Date()): boolean {
  if (appt.type === "block" || appt.paid) return false;
  const today = todayInArgentina(now);
  const day = appt.date.slice(0, 10);
  if (day < today) return true;
  if (day > today) return false;
  // "HH:MM" y "HH:MM:SS" se comparan bien como texto si se completan los segundos
  const end = appt.end_time.length === 5 ? `${appt.end_time}:00` : appt.end_time;
  return end <= nowTimeInArgentina(now);
}

type PastUnpaidSummaryFields = PastUnpaidFields & Pick<Appointment, "price">;

/** Turnos del rango [from, to] ("YYYY-MM-DD") que ya terminaron sin cobrar, y cuánto suman. */
export function summarizePastUnpaid(
  appointments: PastUnpaidSummaryFields[],
  from: string,
  to: string,
  now: Date = new Date()
): { count: number; amount: number } {
  let count = 0;
  let amount = 0;
  for (const a of appointments) {
    const day = a.date.slice(0, 10);
    if (day < from || day > to || !isPastUnpaid(a, now)) continue;
    count += 1;
    amount += a.price ?? 0;
  }
  return { count, amount };
}

