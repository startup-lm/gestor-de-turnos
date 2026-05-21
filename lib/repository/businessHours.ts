import { GlobalHours } from "@/lib/types/BusinessHours";

const BASE = process.env.NEXT_PUBLIC_APP_URL!;

export const getBusinessHours = async (): Promise<GlobalHours| null> => {
  try {
    const res = await fetch(`${BASE}/api/business-hours`, {
      next: { tags: ["business-hours"]},
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (!text.trim().startsWith("{")) return null;
    return JSON.parse(text);
  } catch (err) {
    console.error("getBusinessHours error:", err);
    return null;
  }
};

export const upsertBusinessHours = async (hours: GlobalHours): Promise<GlobalHours | null> => {
  const res = await fetch(`${BASE}/api/business-hours`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(hours),
  });
  if (!res.ok) return null;
  return await res.json();
};
