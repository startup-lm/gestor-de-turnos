import { BusinessSettings } from "@/lib/types/BusinessSettings";

import { getBaseUrl } from "@/utils/getBaseUrl";
const BASE = getBaseUrl();

export const getBusinessSettings = async (): Promise<BusinessSettings> => {
  const fallback: BusinessSettings = { slot_step_minutes: 30 };
  try {
    const res = await fetch(`${BASE}/api/business-settings`, {
      next: { tags: ["business-settings"]},
    });
    if (!res.ok) return fallback;
    const text = await res.text();
    if (!text.trim().startsWith("{")) return fallback;
    return JSON.parse(text);
  } catch (err) {
    console.error("getBusinessSettings error:", err);
    return fallback;
  }
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