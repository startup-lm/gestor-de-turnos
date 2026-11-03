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
    const result = applyPlanToSettings({ plan: "basic", assignment_criteria: "balanced" });
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

  it("descarta rating, reviews y api_key si vienen en el payload", () => {
    const result = toEditableSettingsPayload({
      google_reviews: {
        place_id: "abc",
        api_key: "x",
        rating: 5,
        reviews: [{ id: "1", text: "Buena" }],
      },
    });
    expect(result.google_reviews).toEqual({ place_id: "abc", hidden_review_ids: [] });
  });

  it("filtra elementos no strings en hidden_review_ids", () => {
    const result = toEditableSettingsPayload({
      google_reviews: {
        place_id: "abc",
        hidden_review_ids: ["a", 3 as unknown as string],
      },
    });
    expect(result.google_reviews).toEqual({
      place_id: "abc",
      hidden_review_ids: ["a"],
    });
  });

  it("limita hidden_review_ids a un maximo de 50 elementos", () => {
    const sixtyIds = Array.from({ length: 60 }, (_, i) => `id-${i}`);
    const result = toEditableSettingsPayload({
      google_reviews: {
        place_id: "abc",
        hidden_review_ids: sixtyIds,
      },
    });
    const reviewsConfig = result.google_reviews as { hidden_review_ids: string[] };
    expect(reviewsConfig.hidden_review_ids).toHaveLength(50);
    expect(reviewsConfig.hidden_review_ids).toEqual(sixtyIds.slice(0, 50));
  });
});
