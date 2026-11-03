import { describe, it, expect } from "vitest";
import { argentinaDayRangeUtc, todayInArgentina, formatLocalDate, createdAtBound } from "@/lib/dates/argentina";
import { getPresetRange, presetFromClosingFrequency } from "@/lib/dates/presets";

describe("argentinaDayRangeUtc", () => {
  it.each([
    ["2026-11-30", "2026-11-30T03:00:00.000Z", "2026-12-01T02:59:59.999Z"],
    ["2026-12-31", "2026-12-31T03:00:00.000Z", "2027-01-01T02:59:59.999Z"],
    ["2024-02-28", "2024-02-28T03:00:00.000Z", "2024-02-29T02:59:59.999Z"],
  ])("%s", (day, start, end) => {
    expect(argentinaDayRangeUtc(day)).toEqual({ start, end });
  });

  it("createdAtBound respeta los valores que ya traen hora", () => {
    expect(createdAtBound("2026-11-02T10:00:00Z", "start")).toBe("2026-11-02T10:00:00Z");
    expect(createdAtBound("2026-11-02", "end")).toBe("2026-11-03T02:59:59.999Z");
  });
});

describe("todayInArgentina", () => {
  it("antes de las 03:00 UTC sigue siendo el día anterior en Argentina", () => {
    expect(todayInArgentina(new Date("2026-11-03T02:30:00Z"))).toBe("2026-11-02");
    expect(todayInArgentina(new Date("2026-11-03T03:00:00Z"))).toBe("2026-11-03");
  });
});

describe("getPresetRange", () => {
  const monday = new Date(2026, 10, 2, 15, 0, 0);
  const range = (p: Parameters<typeof getPresetRange>[0], now = monday) => {
    const { start, end } = getPresetRange(p, now);
    return [formatLocalDate(start), formatLocalDate(end), end.getHours(), end.getMinutes()];
  };

  it("hoy", () => expect(range("today")).toEqual(["2026-11-02", "2026-11-02", 23, 59]));
  it("semana de lunes a domingo", () => expect(range("week")).toEqual(["2026-11-02", "2026-11-08", 23, 59]));
  it("un domingo cae en la semana que termina ese día", () =>
    expect(range("week", new Date(2026, 10, 8, 10, 0, 0))).toEqual(["2026-11-02", "2026-11-08", 23, 59]));
  it("este mes", () => expect(range("month")).toEqual(["2026-11-01", "2026-11-30", 23, 59]));
  it("mes pasado", () => expect(range("last_month")).toEqual(["2026-10-01", "2026-10-31", 23, 59]));
});

describe("presetFromClosingFrequency", () => {
  it("mapea la frecuencia de cierre al período por defecto", () => {
    expect(presetFromClosingFrequency("daily")).toBe("today");
    expect(presetFromClosingFrequency("weekly")).toBe("week");
    expect(presetFromClosingFrequency("manual")).toBe("month");
    expect(presetFromClosingFrequency(undefined)).toBe("month");
  });
});
