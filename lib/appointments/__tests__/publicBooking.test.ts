import { describe, it, expect } from "vitest";
import {
  addMinutesToTime,
  isPastInArgentina,
  isWithinBusinessHours,
} from "../publicBooking";

describe("publicBooking", () => {
  describe("addMinutesToTime", () => {
    it("suma minutos correctamente", () => {
      expect(addMinutesToTime("10:00", 30)).toBe("10:30");
      expect(addMinutesToTime("10:45", 30)).toBe("11:15");
      expect(addMinutesToTime("23:29", 30)).toBe("23:59");
    });

    it("retorna null si excede las 23:59 o es inválido", () => {
      expect(addMinutesToTime("23:30", 30)).toBeNull();
      expect(addMinutesToTime("23:45", 30)).toBeNull();
    });
  });

  describe("isPastInArgentina", () => {
    it("determina si una fecha/hora es pasada en UTC-3 respecto a now fijo", () => {
      // 13:00:00Z en UTC equivale a las 10:00:00 en Argentina (UTC-3)
      const now = new Date("2030-01-01T13:00:00Z");

      // 09:59 en Argentina es las 12:59Z -> pasado
      expect(isPastInArgentina("2030-01-01", "09:59", now)).toBe(true);

      // 10:01 en Argentina es las 13:01Z -> futuro
      expect(isPastInArgentina("2030-01-01", "10:01", now)).toBe(false);
    });
  });

  describe("isWithinBusinessHours", () => {
    const defaultHours = {
      open_time: "09:00",
      close_time: "20:00",
      closed_days: [0], // Domingo cerrado
    };

    it("rechaza si cae en un día cerrado", () => {
      // 2026-11-15 es domingo (getUTCDay() = 0)
      expect(isWithinBusinessHours("2026-11-15", "10:00", defaultHours)).toBe(false);
    });

    it("permite si el inicio es igual a open_time", () => {
      // 2026-11-16 es lunes (getUTCDay() = 1)
      expect(isWithinBusinessHours("2026-11-16", "09:00", defaultHours)).toBe(true);
    });

    it("rechaza si el inicio es igual a close_time", () => {
      expect(isWithinBusinessHours("2026-11-16", "20:00", defaultHours)).toBe(false);
    });

    it("funciona correctamente cuando closed_days es null", () => {
      const hoursWithoutClosedDays = {
        open_time: "09:00",
        close_time: "20:00",
        closed_days: null,
      };
      // Domingo con closed_days null se permite si el horario coincide
      expect(isWithinBusinessHours("2026-11-15", "10:00", hoursWithoutClosedDays)).toBe(true);
      expect(isWithinBusinessHours("2026-11-15", "08:59", hoursWithoutClosedDays)).toBe(false);
    });
  });
});
