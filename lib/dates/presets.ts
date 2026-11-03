export type DatePreset = "today" | "week" | "month" | "last_month" | "custom";
export type FixedDatePreset = Exclude<DatePreset, "custom">;

export const DATE_PRESET_LABELS: Record<FixedDatePreset, string> = {
  today: "Hoy",
  week: "Esta semana",
  month: "Este mes",
  last_month: "Mes pasado",
};

const startOfDay = (y: number, m: number, d: number) => new Date(y, m, d, 0, 0, 0, 0);
const endOfDay = (y: number, m: number, d: number) => new Date(y, m, d, 23, 59, 59, 999);

/** Rango local [start 00:00:00.000, end 23:59:59.999] del preset. Semana = lunes a domingo. */
export function getPresetRange(preset: FixedDatePreset, now: Date = new Date()): { start: Date; end: Date } {
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();

  switch (preset) {
    case "today":
      return { start: startOfDay(y, m, d), end: endOfDay(y, m, d) };
    case "week": {
      // getDay(): 0 = domingo. Lunes = día 0 de la semana.
      const daysSinceMonday = (now.getDay() + 6) % 7;
      return { start: startOfDay(y, m, d - daysSinceMonday), end: endOfDay(y, m, d - daysSinceMonday + 6) };
    }
    case "month":
      return { start: startOfDay(y, m, 1), end: endOfDay(y, m + 1, 0) };
    case "last_month":
      return { start: startOfDay(y, m - 1, 1), end: endOfDay(y, m, 0) };
  }
}

/** Preset por defecto del balance según business_settings.cash_closing_frequency. */
export function presetFromClosingFrequency(freq?: "daily" | "weekly" | "manual" | null): FixedDatePreset {
  if (freq === "daily") return "today";
  if (freq === "weekly") return "week";
  return "month";
}
