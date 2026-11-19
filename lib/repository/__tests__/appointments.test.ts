process.env.TZ = "America/Argentina/Buenos_Aires";

import { describe, it, expect, vi, afterEach } from "vitest";
import { getBarbersAppointmentsFromDates, createAppointment } from "@/lib/repository/appointments";

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

describe("createAppointment", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    [new Date(2026, 10, 19, 21, 30), "2026-11-19"],
    [new Date(2026, 10, 19, 0, 0), "2026-11-19"],
    [new Date(2026, 11, 31, 22, 0), "2026-12-31"],
  ])("formats date using local time: %s -> %s", async (inputDate, expectedDate) => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, id: 1 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await createAppointment({
      client: "Test",
      barber_id: 1,
      date: inputDate,
      start_time: "21:30",
      end_time: "22:00",
      phone: "1123456789",
      service_id: 1,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.date).toBe(expectedDate);
  });
});

