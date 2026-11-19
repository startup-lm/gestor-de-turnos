import { describe, it, expect, vi } from "vitest";
import { buildAppointmentChartData } from "@/lib/hooks/useDashboardData";

vi.mock("@/lib/repository/appointments", () => ({
  getBarbersAppointmentsFromDates: vi.fn(),
}));

describe("buildAppointmentChartData", () => {
  it("devuelve array vacío para una lista vacía", () => {
    expect(buildAppointmentChartData([], "month")).toEqual([]);
  });

  it("agrupa y ordena por mes sumando count, paidCount y revenue de cobrados", () => {
    const appointments = [
      { date: "2026-11-18", paid: true, price: 15000 },
      { date: "2026-11-18", paid: false, price: null as unknown as number },
      { date: "2026-10-05", paid: true, price: 8000 },
    ];

    const result = buildAppointmentChartData(appointments, "month");

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      date: "2026-10",
      count: 1,
      paidCount: 1,
      revenue: 8000,
    });
    expect(result[1]).toMatchObject({
      date: "2026-11",
      count: 2,
      paidCount: 1,
      revenue: 15000,
    });
  });
});
