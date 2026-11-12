export const OVERLAP_ERROR_MESSAGE = "El horario seleccionado coincide o se solapa con otro turno ya agendado.";

/**
 * Suma minutos a una hora en formato "HH:mm".
 * Retorna null si excede las 23:59 (total >= 1440 minutos) o si el resultado es negativo.
 */
export function addMinutesToTime(time: string, minutes: number): string | null {
  const [h, m] = time.slice(0, 5).split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  const total = h * 60 + m + minutes;
  if (total < 0 || total >= 24 * 60) return null;
  const newH = Math.floor(total / 60);
  const newM = total % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

/**
 * Evalúa si una fecha y hora (en zona horaria argentina UTC-3) es pasada respecto a `now`.
 */
export function isPastInArgentina(date: string, time: string, now: Date = new Date()): boolean {
  const timeWithSeconds = time.length === 5 ? `${time}:00` : time;
  return new Date(`${date}T${timeWithSeconds}-03:00`).getTime() < now.getTime();
}

/**
 * Verifica si el horario de inicio de un turno está dentro del horario de atención del local.
 * open_time <= start_time < close_time (comparado en minutos)
 * y la fecha no cae en un día de atención cerrado (closed_days).
 */
export function isWithinBusinessHours(
  date: string,
  start: string,
  hours: { open_time: string; close_time: string; closed_days: number[] | null }
): boolean {
  const dayOfWeek = new Date(`${date}T12:00:00Z`).getUTCDay();
  if (hours.closed_days && Array.isArray(hours.closed_days) && hours.closed_days.includes(dayOfWeek)) {
    return false;
  }

  const parseMinutes = (t: string) => {
    const [h, m] = t.slice(0, 5).split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const startMin = parseMinutes(start);
  const openMin = parseMinutes(hours.open_time);
  const closeMin = parseMinutes(hours.close_time);

  if (startMin < openMin || startMin >= closeMin) {
    return false;
  }

  return true;
}
