import { describe, it, expect } from "vitest";
import { isFeatureEnabled, DEFAULT_FEATURES } from "@/lib/flags";

describe("isFeatureEnabled", () => {
  it("por defecto, toda funcionalidad nueva debe nacer apagada (false)", () => {
    expect(DEFAULT_FEATURES.arca).toBe(false);
    expect(DEFAULT_FEATURES.cash_management).toBe(false);
    expect(isFeatureEnabled("arca")).toBe(false);
    expect(isFeatureEnabled("cash_management")).toBe(false);
  });

  it("debe retornar false si no se proporciona el objeto features o es null", () => {
    expect(isFeatureEnabled("arca", null)).toBe(false);
    expect(isFeatureEnabled("arca", undefined)).toBe(false);
  });

  it("debe respetar la configuración de la base de datos de cada cliente", () => {
    const clientFeatures = {
      arca: true,
      cash_management: false,
    };

    expect(isFeatureEnabled("arca", clientFeatures)).toBe(true);
    expect(isFeatureEnabled("cash_management", clientFeatures)).toBe(false);
  });

  it("si una feature no existe en el objeto del cliente, debe caer al default apagado", () => {
    const incompleteFeatures = {};

    expect(isFeatureEnabled("arca", incompleteFeatures)).toBe(false);
    expect(isFeatureEnabled("feature_inexistente", incompleteFeatures)).toBe(false);
  });
});
