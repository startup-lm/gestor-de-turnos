import { GlobalHours } from "@/lib/types/BusinessHours";
import { BusinessSettings } from "@/lib/types/BusinessSettings";
import { getBusinessHours } from "./businessHours";
import { getBusinessSettings } from "./businessSettings";

export type CalendarConfig = {
  businessHours: GlobalHours;
  businessSettings: BusinessSettings;
};

export const getCalendarConfig = async (): Promise<CalendarConfig> => {
  const [hours, settings] = await Promise.all([getBusinessHours(), getBusinessSettings()]);
  const businessHours: GlobalHours = {
    open_time: hours?.open_time ?? null,
    close_time: hours?.close_time ?? null,
    lunch_start: hours?.lunch_start ?? null,
    lunch_end: hours?.lunch_end ?? null,
    closed_days: Array.isArray(hours?.closed_days) ? hours.closed_days : [],
  };
  return { businessHours, businessSettings: settings ?? { slot_step_minutes: 30 },};
};