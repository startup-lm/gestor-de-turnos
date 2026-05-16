import { BusinessSettings } from "@/lib/types/BusinessSettings";

const BASE = process.env.NEXT_PUBLIC_APP_URL!;

export const getBusinessSettings = async (): Promise<BusinessSettings> => {
  const res = await fetch(`${BASE}/api/business-settings`, {
    next: { tags: ["business-settings"]},
  });
  if (!res.ok) return { slot_step_minutes: 30 };
  return await res.json();
};

export const updateBusinessSettings = async (payload: BusinessSettings): Promise<BusinessSettings | null> => {
  const res = await fetch(`${BASE}/api/business-settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return null;
  return await res.json();
};