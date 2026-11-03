import { BusinessSettings } from "@/lib/types/BusinessSettings";

import { getBaseUrl } from "@/utils/getBaseUrl";
const BASE = getBaseUrl();

export const getBusinessSettings = async (): Promise<BusinessSettings> => {
  const fallback: BusinessSettings = { slot_step_minutes: 30 };
  if (typeof window === "undefined") {
    try {
      const { supabaseAdmin } = await import("@/lib/supabase/supabaseAdmin");
      const { data, error } = await supabaseAdmin
        .from("business_settings")
        .select("*")
        .eq("id", 1)
        .single();
      if (error || !data) return fallback;
      const { toPublicBusinessSettings } = await import("@/lib/settings/sanitize");
      return toPublicBusinessSettings(data);
    } catch (e) {
      console.error("getBusinessSettings server query error:", e);
      return fallback;
    }
  }

  try {
    const res = await fetch(`${BASE}/api/business-settings`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("No se pudo cargar la configuración. Probá de nuevo.");
    const text = await res.text();
    if (!text.trim().startsWith("{")) throw new Error("No se pudo cargar la configuración. Probá de nuevo.");
    return JSON.parse(text);
  } catch (err) {
    console.error("getBusinessSettings error:", err);
    throw err;
  }
};

export const updateBusinessSettings = async (
  payload: Partial<BusinessSettings>
): Promise<BusinessSettings | null> => {
  const res = await fetch(`${BASE}/api/business-settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const message = data?.error || "No se pudieron guardar los cambios";
    throw new Error(message);
  }
  return await res.json();
};