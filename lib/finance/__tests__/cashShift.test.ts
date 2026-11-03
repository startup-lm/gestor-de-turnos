import { describe, it, expect } from "vitest";
import { computeShiftExpected, buildMethodTotals, closingReminderDue } from "@/lib/finance/cashShift";

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

describe("closingReminderDue", () => {
  // 3/11 15:00 en Argentina
  const NOW = new Date("2026-11-03T18:00:00Z");

  it("diaria: avisa si el período empezó ayer", () => {
    expect(closingReminderDue("2026-11-02T22:00:00Z", "daily", NOW)).toBe(true);
    expect(closingReminderDue("2026-11-03T12:00:00Z", "daily", NOW)).toBe(false);
  });

  it("diaria: usa el día de Argentina, no el de UTC", () => {
    // 3/11 01:00 UTC = 2/11 22:00 en Argentina: fue ayer
    expect(closingReminderDue("2026-11-03T01:00:00Z", "daily", NOW)).toBe(true);
  });

  it("semanal: avisa recién después de 7 días", () => {
    expect(closingReminderDue("2026-10-30T18:00:00Z", "weekly", NOW)).toBe(false);
    expect(closingReminderDue("2026-10-26T17:00:00Z", "weekly", NOW)).toBe(true);
  });

  it("manual: nunca avisa", () => {
    expect(closingReminderDue("2026-01-01T00:00:00Z", "manual", NOW)).toBe(false);
  });

  it("sin frecuencia configurada se comporta como diaria", () => {
    expect(closingReminderDue("2026-11-02T22:00:00Z", null, NOW)).toBe(true);
  });
});
