import { describe, it, expect } from "vitest";
import { computePayout, periodsOverlap } from "@/lib/finance/payout";
import { computeCashSummary, normalizeMethod } from "@/lib/finance/cashSummary";
import { buildPayoutWhatsAppText } from "@/lib/finance/payoutText";
import { fetchAllRows } from "@/lib/supabase/fetchAllRows";

describe("computePayout", () => {
  it.each([
    // cutsRevenue, rate, salesRevenue, saleRate, advances, cutsComm, salesComm, subtotal, totalToPay, excess
    [100000, 0.5, 30000, 0.1, 10000, 50000, 3000, 53000, 43000, 0],
    [33333, 0.5, 999, 0.15, 0, 16667, 150, 16817, 16817, 0],
    [5000, 1, 0, 0, 8000, 5000, 0, 5000, 0, 3000],
    [10000, 1, 0, 0, 10000, 10000, 0, 10000, 0, 0],
    [10000, 1, 0, 0, 9999, 10000, 0, 10000, 1, 0],
  ])("cortes %d × %d, ventas %d × %d, adelantos %d", (cutsRevenue, rate, salesRevenue, saleRate, advances, cutsComm, salesComm, subtotal, totalToPay, excess) => {
    const r = computePayout({
      cutsCount: 3, cutsRevenue, commissionRate: rate,
      salesCount: 1, salesRevenue, saleCommissionRate: saleRate,
      advancesTotal: advances,
    });
    expect(r).toMatchObject({ cutsCommission: cutsComm, salesCommission: salesComm, subtotal, totalToPay, advancesExcess: excess, advancesDeducted: advances });
  });
});

describe("periodsOverlap", () => {
  it("detecta superposición inclusiva", () => {
    expect(periodsOverlap("2026-11-01", "2026-11-15", "2026-11-15", "2026-11-30")).toBe(true);
    expect(periodsOverlap("2026-11-01", "2026-11-14", "2026-11-15", "2026-11-30")).toBe(false);
    expect(periodsOverlap("2026-11-10", "2026-11-12", "2026-11-01", "2026-11-30")).toBe(true);
  });
});

describe("computeCashSummary", () => {
  it("suma cobros y resta egresos por medio, ignorando anulados", () => {
    const result = computeCashSummary({
      methods: ["Efectivo", "Mercado Pago"],
      appointments: [
        { price: 10000, payment_method: "Efectivo" },
        { price: 5000, payment_method: "MercadoPago" },
        { price: 2000, payment_method: null },
      ],
      sales: [{ total: 3000, payment_method: "Efectivo" }],
      movements: [
        { type: "expense", amount: 1500, payment_method: "Efectivo" },
        { type: "advance", amount: 2000, payment_method: "Efectivo" },
        { type: "commission_payout", amount: 1000, payment_method: "Mercado Pago" },
        { type: "expense", amount: 999, payment_method: "Efectivo", voided_at: "2026-11-02T10:00:00Z" },
      ],
    });

    expect(result.rows).toEqual([
      { method: "Efectivo", income: 13000, outcome: 3500, net: 9500 },
      { method: "Mercado Pago", income: 5000, outcome: 1000, net: 4000 },
      { method: "Sin especificar", income: 2000, outcome: 0, net: 2000 },
    ]);
    expect(result.totals).toEqual({ income: 20000, outcome: 4500, net: 15500 });
  });

  it("muestra los medios configurados aunque no tengan movimientos", () => {
    const result = computeCashSummary({ methods: ["Efectivo", "Transferencia"], appointments: [], sales: [], movements: [] });
    expect(result.rows.map((r) => [r.method, r.net])).toEqual([["Efectivo", 0], ["Transferencia", 0]]);
  });

  it("normalizeMethod", () => {
    expect(normalizeMethod(" MercadoPago ")).toBe("Mercado Pago");
    expect(normalizeMethod("")).toBe("Sin especificar");
    expect(normalizeMethod(null)).toBe("Sin especificar");
  });
});

describe("buildPayoutWhatsAppText", () => {
  it("arma el recibo con el número de liquidación y sin texto de sistema", () => {
    const text = buildPayoutWhatsAppText({
      id: 12, barber_id: 1, period_start: "2026-11-01", period_end: "2026-11-15",
      cuts_count: 10, cuts_commission_amount: 50000, sales_count: 2, sales_commission_amount: 1500,
      advances_deducted: 5000, total_paid: 46500, payment_method: "Efectivo", payment_date: "2026-11-16", paid_by: "a@b.com",
    }, "Lucas");
    expect(text.startsWith("💈 *Liquidación #12*")).toBe(true);
    expect(text).toContain("01/11/2026 al 15/11/2026");
    expect(text).toContain("$46.500");
    expect(text).not.toMatch(/autom[aá]ticamente/);
  });
});

describe("fetchAllRows", () => {
  it("trae todas las páginas hasta que una viene incompleta", async () => {
    const all = Array.from({ length: 2500 }, (_, i) => i);
    const calls: [number, number][] = [];
    const { data, error } = await fetchAllRows<number>(async (from, to) => {
      calls.push([from, to]);
      return { data: all.slice(from, to + 1), error: null };
    });
    expect(error).toBeNull();
    expect(data).toHaveLength(2500);
    expect(calls).toEqual([[0, 999], [1000, 1999], [2000, 2999]]);
  });

  it("corta y devuelve el error de la base", async () => {
    const { data, error } = await fetchAllRows(async () => ({ data: null, error: { message: "boom" } }));
    expect(data).toEqual([]);
    expect(error).toEqual({ message: "boom" });
  });
});
