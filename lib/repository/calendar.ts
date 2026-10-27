import { GlobalHours } from "@/lib/types/BusinessHours";
import { BusinessSettings } from "@/lib/types/BusinessSettings";
import { getBusinessHours } from "./businessHours";
import { getBusinessSettings } from "./businessSettings";

export type CalendarConfig = {
  businessHours: GlobalHours;
  businessSettings: BusinessSettings;
};

let cachedConfig: CalendarConfig | null = null;
let cacheTime = 0;
const CACHE_TTL = 60_000; // 1 minuto

export const getCalendarConfig = async (forceRefresh = false): Promise<CalendarConfig> => {
  const now = Date.now();
  if (!forceRefresh && cachedConfig && now - cacheTime < CACHE_TTL) {
    return cachedConfig;
  }
  const [hours, settings] = await Promise.all([getBusinessHours(), getBusinessSettings()]);
  const businessHours: GlobalHours = {
    open_time: hours?.open_time ?? null,
    close_time: hours?.close_time ?? null,
    lunch_start: hours?.lunch_start ?? null,
    lunch_end: hours?.lunch_end ?? null,
    closed_days: Array.isArray(hours?.closed_days) ? hours.closed_days : [],
  };
  cachedConfig = { businessHours, businessSettings: settings ?? { slot_step_minutes: 30 } };
  cacheTime = now;
  return cachedConfig;
};