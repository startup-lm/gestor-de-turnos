process.env.TZ = "America/Argentina/Buenos_Aires";

import { describe, it, expect, vi, afterEach } from "vitest";
import { getBarbersAppointmentsFromDates } from "@/lib/repository/appointments";

describe("getBarbersAppointmentsFromDates", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("handles single-day Argentina range without overflowing to next day", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => "[]",
    });
    vi.stubGlobal("fetch", fetchMock);

    const start = new Date(2026, 10, 19, 0, 0, 0);
    const end = new Date(2026, 10, 19, 23, 59, 59);

    await getBarbersAppointmentsFromDates(7, start, end);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = new URL(fetchMock.mock.calls[0][0] as string, "http://localhost");
    expect(url.searchParams.get("start_date")).toBe("2026-11-19");
    expect(url.searchParams.get("end_date")).toBe("2026-11-19");
    expect(url.searchParams.get("barber_id")).toBe("7");
  });

  it("handles full month range in November correctly", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => "[]",
    });
    vi.stubGlobal("fetch", fetchMock);

    const start = new Date(2026, 10, 1, 0, 0, 0);
    const end = new Date(2026, 10, 30, 23, 59, 59);

    await getBarbersAppointmentsFromDates(3, start, end);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = new URL(fetchMock.mock.calls[0][0] as string, "http://localhost");
    expect(url.searchParams.get("start_date")).toBe("2026-11-01");
    expect(url.searchParams.get("end_date")).toBe("2026-11-30");
    expect(url.searchParams.get("barber_id")).toBe("3");
  });

  it("handles full month range in October correctly", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => "[]",
    });
    vi.stubGlobal("fetch", fetchMock);

    const start = new Date(2026, 9, 1, 0, 0, 0);
    const end = new Date(2026, 9, 31, 23, 59, 59);

    await getBarbersAppointmentsFromDates(12, start, end);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = new URL(fetchMock.mock.calls[0][0] as string, "http://localhost");
    expect(url.searchParams.get("start_date")).toBe("2026-10-01");
    expect(url.searchParams.get("end_date")).toBe("2026-10-31");
    expect(url.searchParams.get("barber_id")).toBe("12");
  });
});
