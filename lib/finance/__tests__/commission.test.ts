import { describe, it, expect, vi } from "vitest";
import { commissionOf } from "@/lib/finance/commission";

vi.mock("@/lib/supabase/supabaseAdmin", () => ({ supabaseAdmin: {} }));
import { endsInTheFuture } from "@/lib/finance/payoutData";

describe("commissionOf", () => {
  it("usa el % congelado al cobrar aunque el % actual sea otro", () => {
    expect(commissionOf(10000, 0.5, 0.7)).toBe(5000);
  });

  it("sin % guardado (cargado antes del cambio) usa el % actual", () => {
    expect(commissionOf(10000, null, 0.7)).toBe(7000);
    expect(commissionOf(10000, undefined, 0.7)).toBe(7000);
  });

  it("un % congelado en 0 se respeta, no cae al actual", () => {
    expect(commissionOf(10000, 0, 0.7)).toBe(0);
  });

  it("sin monto la comisión es 0", () => {
    expect(commissionOf(null, 0.5, 0.5)).toBe(0);
  });
});

describe("endsInTheFuture", () => {
  it("no permite liquidar días que todavía no pasaron", () => {
    expect(endsInTheFuture("2026-11-04", "2026-11-03")).toBe(true);
    expect(endsInTheFuture("2026-11-03", "2026-11-03")).toBe(false);
    expect(endsInTheFuture("2026-10-31", "2026-11-03")).toBe(false);
  });
});
