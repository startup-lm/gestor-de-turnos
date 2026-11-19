process.env.TZ = "America/Argentina/Buenos_Aires";

import { describe, it, expect } from "vitest";
import { currentWeekDayRange } from "@/lib/dates/argentina";

describe("currentWeekDayRange", () => {
  it.each([
    [new Date(2026, 10, 19, 21, 30), { start: "2026-11-16", end: "2026-11-22" }],
    [new Date(2026, 10, 16, 0, 30), { start: "2026-11-16", end: "2026-11-22" }],
    [new Date(2026, 10, 22, 23, 0), { start: "2026-11-16", end: "2026-11-22" }],
    [new Date(2026, 11, 31, 22, 0), { start: "2026-12-28", end: "2027-01-03" }],
  ])("returns correct week range for %s", (now, expected) => {
    expect(currentWeekDayRange(now)).toEqual(expected);
  });
});
