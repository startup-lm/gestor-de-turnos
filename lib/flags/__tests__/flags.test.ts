import { describe, it, expect } from "vitest";
import {
  isFeatureEnabled,
  getPlanLimits,
  resolvePlan,
  DEFAULT_FEATURES,
  PLAN_FEATURES,
} from "@/lib/flags";

const STANDARD = [
  "arca",
  "google_reviews",
  "metrics",
  "sales",
  "commission_payouts",
  "staff_management",
  "booking_rules",
  "stock_control",
  "cash_register",
  "custom_payment_methods",
  "cash_closing",
];
const PREMIUM_ONLY = ["finances", "expenses"];

describe("isFeatureEnabled", () => {
  it("por defecto, toda funcionalidad debe nacer apagada (false)", () => {
    for (const [flag, value] of Object.entries(DEFAULT_FEATURES)) {
      expect(value).toBe(false);
      expect(isFeatureEnabled(flag)).toBe(false);
    }
  });

  it("si una feature no existe, cae al default apagado", () => {
    expect(isFeatureEnabled("feature_inexistente", {}, "premium")).toBe(false);
  });
});

describe("planes comerciales", () => {
  it("sin plan o con un plan desconocido se asume basic", () => {
    expect(resolvePlan(null)).toBe("basic");
    expect(resolvePlan("pro")).toBe("basic");
    expect(isFeatureEnabled("arca", null, "plan_inexistente")).toBe(false);
  });

  it("basic no incluye ninguna feature paga", () => {
    expect(Object.values(PLAN_FEATURES.basic).some(Boolean)).toBe(false);
    for (const flag of [...STANDARD, ...PREMIUM_ONLY]) {
      expect(isFeatureEnabled(flag, null, "basic")).toBe(false);
    }
  });

  it("standard incluye ARCA, métricas, ventas, liquidaciones, profesionales, reseñas, criterios de turno, stock y caja", () => {
    for (const flag of STANDARD) expect(isFeatureEnabled(flag, null, "standard")).toBe(true);
    for (const flag of PREMIUM_ONLY) expect(isFeatureEnabled(flag, null, "standard")).toBe(false);
  });

  it("premium incluye todo lo de standard más finanzas y gastos", () => {
    for (const flag of [...STANDARD, ...PREMIUM_ONLY]) {
      expect(isFeatureEnabled(flag, null, "premium")).toBe(true);
    }
  });

  it("el override en features tiene prioridad sobre el plan", () => {
    expect(isFeatureEnabled("arca", { arca: false }, "premium")).toBe(false);
    expect(isFeatureEnabled("finances", { finances: true }, "basic")).toBe(true);
  });

  it("advances está apagado en basic, standard y premium y se prende con override", () => {
    const plans = ["basic", "standard", "premium"] as const;
    for (const plan of plans) {
      expect(isFeatureEnabled("advances", null, plan)).toBe(false);
    }
    expect(isFeatureEnabled("advances", { advances: true }, "basic")).toBe(true);
  });
});

describe("getPlanLimits", () => {
  it("basic: 1 profesional y sin medios de cobro configurables", () => {
    expect(getPlanLimits("basic")).toEqual({ maxBarbers: 1, maxPaymentMethods: 0 });
  });

  it("standard: hasta 4 profesionales y medios de cobro sin límite", () => {
    expect(getPlanLimits("standard")).toEqual({ maxBarbers: 4, maxPaymentMethods: Infinity });
  });

  it("standard y premium: medios de cobro sin límite", () => {
    expect(getPlanLimits("standard").maxPaymentMethods).toBe(Infinity);
    expect(getPlanLimits("premium").maxPaymentMethods).toBe(Infinity);
  });

  it("premium: sin límites", () => {
    expect(getPlanLimits("premium")).toEqual({ maxBarbers: Infinity, maxPaymentMethods: Infinity });
  });

  it("sin plan aplica los límites de basic", () => {
    expect(getPlanLimits(undefined)).toEqual(getPlanLimits("basic"));
  });
});
