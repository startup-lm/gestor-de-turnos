import { describe, it, expect } from "vitest";
import { applyPlanToSettings, toEditableSettingsPayload, toPublicBusinessSettings } from "@/lib/settings/sanitize";

describe("toPublicBusinessSettings", () => {
  it("quita la API key de Google antes de enviar al navegador", () => {
    const result = toPublicBusinessSettings({
      slot_step_minutes: 30,
      google_reviews: { place_id: "abc", api_key: "SECRETA" },
    });
    expect(result.google_reviews).toEqual({ place_id: "abc" });
  });

  it("no rompe si no hay configuración de reseñas", () => {
    const settings = { slot_step_minutes: 30 as const, plan: "premium" as const };
    expect(toPublicBusinessSettings(settings)).toEqual(settings);
  });
});

describe("applyPlanToSettings", () => {
  it("sin criterios de turno en el plan, la asignación vuelve a aleatoria", () => {
    const result = applyPlanToSettings({ plan: "standard", assignment_criteria: "balanced" });
    expect(result.assignment_criteria).toBe("random");
  });

  it("premium conserva el criterio de asignación elegido", () => {
    const result = applyPlanToSettings({ plan: "premium", assignment_criteria: "balanced" });
    expect(result.assignment_criteria).toBe("balanced");
  });

  it("basic usa los medios de cobro por defecto", () => {
    const result = applyPlanToSettings({ plan: "basic", payment_methods: ["Transferencia"] });
    expect(result.payment_methods).toEqual(["Efectivo", "Mercado Pago"]);
  });

  it("standard recorta los medios de cobro al límite de 3", () => {
    const result = applyPlanToSettings({ plan: "standard", payment_methods: ["A", "B", "C", "D"] });
    expect(result.payment_methods).toEqual(["A", "B", "C"]);
  });

  it("un override de features habilita la personalización aunque el plan no la incluya", () => {
    const result = applyPlanToSettings({
      plan: "basic",
      features: { booking_rules: true },
      assignment_criteria: "prioritize_admin",
    });
    expect(result.assignment_criteria).toBe("prioritize_admin");
  });
});

describe("toEditableSettingsPayload", () => {
  it("el admin del local no puede cambiar su plan ni activarse features", () => {
    const result = toEditableSettingsPayload({
      business_name: "Mi local",
      plan: "premium",
      features: { arca: true },
      id: 99,
    });
    expect(result).toEqual({ business_name: "Mi local" });
  });

  it("descarta la API key si viene en el payload", () => {
    const result = toEditableSettingsPayload({ google_reviews: { place_id: "abc", api_key: "x" } });
    expect(result.google_reviews).toEqual({ place_id: "abc" });
  });
});
