import { describe, it, expect } from "vitest";
import { computeShiftExpected, buildMethodTotals } from "@/lib/finance/cashShift";

const base = { initialCash: 0, methods: ["Efectivo", "Mercado Pago"], appointments: [], sales: [], movements: [] };

describe("computeShiftExpected", () => {
  it("suma cobros de turnos y ventas por medio de pago", () => {
    const rows = computeShiftExpected({
      ...base,
      appointments: [
        { price: 10000, payment_method: "Efectivo" },
        { price: 8000, payment_method: "MercadoPago" },
      ],
      sales: [{ total: 3000, payment_method: "Efectivo" }],
    });
    expect(rows.find((r) => r.method === "Efectivo")?.expected).toBe(13000);
    expect(rows.find((r) => r.method === "Mercado Pago")?.expected).toBe(8000);
  });

  it("resta gastos y adelantos, e ignora los anulados", () => {
    const rows = computeShiftExpected({
      ...base,
      appointments: [{ price: 10000, payment_method: "Efectivo" }],
      movements: [
        { type: "expense", amount: 2000, payment_method: "Efectivo" },
        { type: "advance", amount: 1000, payment_method: "Efectivo" },
        { type: "expense", amount: 5000, payment_method: "Efectivo", voided_at: "2026-11-03T12:00:00Z" },
      ],
    });
    expect(rows.find((r) => r.method === "Efectivo")).toMatchObject({ income: 10000, outcome: 3000, expected: 7000 });
  });

  it("el fondo inicial solo suma al efectivo", () => {
    const rows = computeShiftExpected({ ...base, initialCash: 5000 });
    expect(rows.find((r) => r.method === "Efectivo")?.expected).toBe(5000);
    expect(rows.find((r) => r.method === "Mercado Pago")?.expected).toBe(0);
  });

  it("el efectivo aparece aunque no esté entre los medios configurados", () => {
    const rows = computeShiftExpected({ ...base, methods: ["Mercado Pago"] });
    expect(rows.map((r) => r.method)).toEqual(["Efectivo", "Mercado Pago"]);
  });
});

describe("buildMethodTotals", () => {
  it("deja en null los medios que no se contaron", () => {
    const totals = buildMethodTotals(
      [
        { method: "Efectivo", income: 0, outcome: 0, expected: 1000 },
        { method: "Mercado Pago", income: 0, outcome: 0, expected: 500 },
      ],
      { Efectivo: 900 }
    );
    expect(totals).toEqual([
      { method: "Efectivo", expected: 1000, counted: 900 },
      { method: "Mercado Pago", expected: 500, counted: null },
    ]);
  });
});
