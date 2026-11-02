import type { BusinessSettings } from "@/lib/types/BusinessSettings";
import {
  isFeatureEnabled,
  getPlanLimits,
  DEFAULT_ASSIGNMENT_CRITERIA,
  DEFAULT_PAYMENT_METHODS,
} from "@/lib/flags";

/**
 * Campos que solo controla el dueño del SaaS (plan contratado y overrides de features).
 * El admin del local no puede modificarlos desde la API: se cambian directo en la base.
 */
export const OWNER_ONLY_SETTINGS_FIELDS = ["plan", "features"] as const;

/**
 * Aplica el plan a la configuración leída: lo que el plan no incluye vuelve a su valor por defecto,
 * así todo el sitio (reserva, cobros, paneles) usa los valores efectivos.
 */
export function applyPlanToSettings<T extends Partial<BusinessSettings>>(settings: T): T {
  if (!settings) return settings;
  const result = { ...settings };
  if (!isFeatureEnabled("booking_rules", settings.features, settings.plan)) {
    result.assignment_criteria = DEFAULT_ASSIGNMENT_CRITERIA;
  }
  const { maxPaymentMethods } = getPlanLimits(settings.plan);
  if (maxPaymentMethods === 0) {
    result.payment_methods = [...DEFAULT_PAYMENT_METHODS];
  } else if (settings.payment_methods && settings.payment_methods.length > maxPaymentMethods) {
    result.payment_methods = settings.payment_methods.slice(0, maxPaymentMethods);
  }
  return result;
}

/** Quita secretos y aplica el plan antes de enviar la configuración al navegador. */
export function toPublicBusinessSettings<T extends Partial<BusinessSettings>>(settings: T): T {
  const effective = applyPlanToSettings(settings);
  if (!effective?.google_reviews) return effective;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { api_key, ...googleReviews } = effective.google_reviews;
  return { ...effective, google_reviews: googleReviews };
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
