import type { BusinessSettings } from "@/lib/types/BusinessSettings";

/**
 * Campos que solo controla el dueño del SaaS (plan contratado y overrides de features).
 * El admin del local no puede modificarlos desde la API: se cambian directo en la base.
 */
export const OWNER_ONLY_SETTINGS_FIELDS = ["plan", "features"] as const;

/** Quita secretos antes de enviar la configuración al navegador. */
export function toPublicBusinessSettings<T extends Partial<BusinessSettings>>(settings: T): T {
  if (!settings?.google_reviews) return settings;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { api_key, ...googleReviews } = settings.google_reviews;
  return { ...settings, google_reviews: googleReviews };
}

/** Deja en el payload de actualización solo los campos editables por el admin del local. */
export function toEditableSettingsPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = { ...payload };
  delete clean.id;
  for (const field of OWNER_ONLY_SETTINGS_FIELDS) delete clean[field];
  if (clean.google_reviews && typeof clean.google_reviews === "object") {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { api_key, ...googleReviews } = clean.google_reviews as Record<string, unknown>;
    clean.google_reviews = googleReviews;
  }
  return clean;
}
