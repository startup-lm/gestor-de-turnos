import { describe, it, expect } from "vitest";
import { toEditableSettingsPayload, toPublicBusinessSettings } from "@/lib/settings/sanitize";

describe("toPublicBusinessSettings", () => {
  it("quita la API key de Google antes de enviar al navegador", () => {
    const result = toPublicBusinessSettings({
      slot_step_minutes: 30,
      google_reviews: { place_id: "abc", api_key: "SECRETA" },
    });
    expect(result.google_reviews).toEqual({ place_id: "abc" });
  });

  it("no rompe si no hay configuración de reseñas", () => {
    expect(toPublicBusinessSettings({ slot_step_minutes: 30 })).toEqual({ slot_step_minutes: 30 });
  });
});

describe("toEditableSettingsPayload", () => {
  it("el admin del local no puede cambiar su plan ni activarse features", () => {
    const result = toEditableSettingsPayload({
      business_name: "Mi local",
      plan: "pro",
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
