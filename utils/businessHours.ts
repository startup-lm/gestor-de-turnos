import { GlobalHours } from "@/lib/types/BusinessHours";

export type BusinessOpenStatus = {
  isOpen: boolean;
  statusText: string;
};

const WEEK_DAYS = [
  { id: 1, name: "Lunes" },
  { id: 2, name: "Martes" },
  { id: 3, name: "Miércoles" },
  { id: 4, name: "Jueves" },
  { id: 5, name: "Viernes" },
  { id: 6, name: "Sábado" },
  { id: 0, name: "Domingo" },
];

const parseTimeToMinutes = (timeStr?: string | null): number | null => {
  if (!timeStr) return null;
  const parts = timeStr.split(":");
  if (parts.length < 2) return null;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

const formatTimeClean = (timeStr?: string | null): string => {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
  }
  return timeStr;
};

function formatDaysSummary(closedDays: number[] = []): string {
  const openDays = WEEK_DAYS.filter((d) => !closedDays.includes(d.id));
  if (openDays.length === 0) return "Cerrado temporalmente";
  if (openDays.length === 7) return "Lunes a Domingo";

  const indices = openDays.map((d) => WEEK_DAYS.findIndex((w) => w.id === d.id));
  const isContiguous = indices.every((idx, i) => i === 0 || idx === indices[i - 1] + 1);

  if (isContiguous && openDays.length > 1) {
    return `${openDays[0].name} a ${openDays[openDays.length - 1].name}`;
  }

  if (openDays.length === 1) return `Solo ${openDays[0].name}`;
  if (openDays.length === 2) return `${openDays[0].name} y ${openDays[1].name}`;

  const last = openDays[openDays.length - 1];
  const rest = openDays.slice(0, -1).map((d) => d.name).join(", ");
  return `${rest} y ${last.name}`;
}

/**
 * Retorna si el negocio está abierto o cerrado en este momento.
 */
export function getBusinessOpenStatus(
  hours: GlobalHours | null | undefined,
  date: Date = new Date()
): BusinessOpenStatus {
  if (!hours || !hours.open_time || !hours.close_time) {
    return { isOpen: true, statusText: "Abierto Ahora" };
  }

  const closedDays = hours.closed_days || [];
  const currentDay = date.getDay();
  const currentMinutes = date.getHours() * 60 + date.getMinutes();

  const openMinutes = parseTimeToMinutes(hours.open_time);
  const closeMinutes = parseTimeToMinutes(hours.close_time);
  const lunchStartMinutes = parseTimeToMinutes(hours.lunch_start);
  const lunchEndMinutes = parseTimeToMinutes(hours.lunch_end);

  if (openMinutes === null || closeMinutes === null) {
    return { isOpen: true, statusText: "Abierto Ahora" };
  }

  // Si hoy es un día cerrado
  if (closedDays.includes(currentDay)) {
    return { isOpen: false, statusText: "Cerrado" };
  }

  // Antes de abrir o después de cerrar
  if (currentMinutes < openMinutes || currentMinutes >= closeMinutes) {
    return { isOpen: false, statusText: "Cerrado" };
  }

  // Pausa de almuerzo/descanso
  const hasLunch =
    lunchStartMinutes !== null &&
    lunchEndMinutes !== null &&
    lunchEndMinutes > lunchStartMinutes;

  if (hasLunch && currentMinutes >= lunchStartMinutes && currentMinutes < lunchEndMinutes) {
    return { isOpen: false, statusText: "Cerrado" };
  }

  return { isOpen: true, statusText: "Abierto Ahora" };
}

/**
 * Genera un texto legible con los días y horarios de atención.
 * Ejemplo: "Martes a Sábado de 11:00 a 13:00 y de 14:00 a 20:00"
 */
export function getScheduleSummary(hours: GlobalHours | null | undefined): string | null {
  if (!hours || !hours.open_time || !hours.close_time) return null;

  const daysText = formatDaysSummary(hours.closed_days || []);
  const open = formatTimeClean(hours.open_time);
  const close = formatTimeClean(hours.close_time);

  const hasLunch = Boolean(hours.lunch_start && hours.lunch_end);
  let hoursText = `de ${open} a ${close}`;
  if (hasLunch) {
    const lStart = formatTimeClean(hours.lunch_start);
    const lEnd = formatTimeClean(hours.lunch_end);
    hoursText = `de ${open} a ${lStart} y de ${lEnd} a ${close}`;
  }

  return `${daysText} ${hoursText}`;
}
