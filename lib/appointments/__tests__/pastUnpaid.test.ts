import { describe, it, expect } from "vitest";
import { isPastUnpaid } from "@/lib/appointments/pastUnpaid";

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
