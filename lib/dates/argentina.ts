/**
 * Fechas del negocio: Argentina usa UTC−3 fijo (sin horario de verano).
 * Las columnas `created_at` se guardan en UTC, así que un día calendario
 * argentino va de las 03:00 UTC de ese día a las 02:59:59.999 UTC del siguiente.
 */
const ARGENTINA_OFFSET_HOURS = 3;

/** Devuelve el rango UTC [inicio, fin] de un día calendario de Argentina. day = "YYYY-MM-DD". */
export function argentinaDayRangeUtc(day: string): { start: string; end: string } {
  const [y, m, d] = day.slice(0, 10).split("-").map(Number);
  return {
    start: new Date(Date.UTC(y, m - 1, d, ARGENTINA_OFFSET_HOURS, 0, 0, 0)).toISOString(),
    end: new Date(Date.UTC(y, m - 1, d + 1, ARGENTINA_OFFSET_HOURS - 1, 59, 59, 999)).toISOString(),
  };
}

/** Fecha de hoy en Argentina como "YYYY-MM-DD". */
export function todayInArgentina(now: Date = new Date()): string {
  return new Date(now.getTime() - ARGENTINA_OFFSET_HOURS * 3600 * 1000).toISOString().slice(0, 10);
}

/** Convierte un Date a "YYYY-MM-DD" con sus componentes locales (sin pasar por UTC). */
export function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Límite UTC para filtrar `created_at`: si ya viene con hora ("...T..."), se usa tal cual;
 * si es un día "YYYY-MM-DD", se convierte al inicio o fin de ese día en Argentina.
 */
export function createdAtBound(value: string, edge: "start" | "end"): string {
  if (value.includes("T")) return value;
  return argentinaDayRangeUtc(value)[edge];
}

/**
 * Límite para filtrar columnas DATE (ej. `sales.created_at`): se usa el día "YYYY-MM-DD" tal cual,
 * sin pasarlo a UTC. Si viene con hora, se queda solo con la parte de la fecha.
 */
export function dateColumnBound(value: string): string {
  return value.slice(0, 10);
}
