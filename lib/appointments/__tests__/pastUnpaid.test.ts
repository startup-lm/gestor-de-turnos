import { describe, it, expect } from "vitest";
import { isPastUnpaid, summarizePastUnpaid } from "@/lib/appointments/pastUnpaid";

// 3 de noviembre de 2026, 15:00 en Argentina (18:00 UTC)
const NOW = new Date("2026-11-03T18:00:00Z");
const appt = (overrides: Partial<Parameters<typeof isPastUnpaid>[0]> = {}) => ({
  date: "2026-11-03",
  end_time: "14:30:00",
  paid: false,
  type: "appointment" as const,
  ...overrides,
});

describe("isPastUnpaid", () => {
  it("un turno de ayer sin cobrar cuenta", () => {
    expect(isPastUnpaid(appt({ date: "2026-11-02", end_time: "20:00:00" }), NOW)).toBe(true);
  });

  it("un turno de hoy que ya terminó cuenta", () => {
    expect(isPastUnpaid(appt({ end_time: "14:30" }), NOW)).toBe(true);
  });

  it("un turno de hoy que todavía no terminó no cuenta", () => {
    expect(isPastUnpaid(appt({ end_time: "15:30:00" }), NOW)).toBe(false);
  });

  it("un turno futuro no cuenta", () => {
    expect(isPastUnpaid(appt({ date: "2026-11-04", end_time: "09:00:00" }), NOW)).toBe(false);
  });

  it("un turno cobrado no cuenta", () => {
    expect(isPastUnpaid(appt({ date: "2026-11-02", paid: true }), NOW)).toBe(false);
  });

  it("un bloqueo de agenda no cuenta", () => {
    expect(isPastUnpaid(appt({ date: "2026-11-02", type: "block" }), NOW)).toBe(false);
  });
});

describe("summarizePastUnpaid", () => {
  it("lista vacía devuelve count 0 y amount 0", () => {
    expect(summarizePastUnpaid([], "2026-11-01", "2026-11-03", NOW)).toEqual({
      count: 0,
      amount: 0,
    });
  });

  it("dos turnos de días anteriores sin cobrar con price 10000 y 5000", () => {
    const list = [
      { ...appt({ date: "2026-11-01" }), price: 10000 },
      { ...appt({ date: "2026-11-02" }), price: 5000 },
    ];
    expect(summarizePastUnpaid(list, "2026-11-01", "2026-11-03", NOW)).toEqual({
      count: 2,
      amount: 15000,
    });
  });

  it("un turno cobrado y un bloqueo de agenda no cuentan", () => {
    const list = [
      { ...appt({ date: "2026-11-02", paid: true }), price: 10000 },
      { ...appt({ date: "2026-11-02", type: "block" }), price: 10000 },
    ];
    expect(summarizePastUnpaid(list, "2026-11-01", "2026-11-03", NOW)).toEqual({
      count: 0,
      amount: 0,
    });
  });

  it("un turno sin cobrar fuera del rango from/to no cuenta", () => {
    const list = [
      { ...appt({ date: "2026-10-31" }), price: 10000 },
    ];
    expect(summarizePastUnpaid(list, "2026-11-01", "2026-11-03", NOW)).toEqual({
      count: 0,
      amount: 0,
    });
  });

  it("un turno sin cobrar con price 0 cuenta en count y suma 0 al amount", () => {
    const list = [
      { ...appt({ date: "2026-11-02" }), price: 0 },
    ];
    expect(summarizePastUnpaid(list, "2026-11-01", "2026-11-03", NOW)).toEqual({
      count: 1,
      amount: 0,
    });
  });
});

