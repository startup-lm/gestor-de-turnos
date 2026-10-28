import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useTotalCommissions } from "@/lib/hooks/useTotalComission";
import { Barber } from "@/lib/types/Barbers";
import { BarberTotals } from "@/lib/hooks/useBarberCutsdata";

describe("useTotalCommissions", () => {
  const barbers: Barber[] = [
    {
      id: 1,
      name: "Lucas",
      role: "barber",
      email: "lucas@test.com",
      image: "",
      instagram: "",
      commission: 0.5, // 50%
    },
    {
      id: 2,
      name: "Marcos",
      role: "barber",
      email: "marcos@test.com",
      image: "",
      instagram: "",
      commission: 0.4, // 40%
    },
  ];

  it("debe calcular correctamente el total acumulado de comisiones por barbero", () => {
    const totals: BarberTotals[] = [
      { barberId: 1, totalAppt: 10, totalRevenue: 100000 },
      { barberId: 2, totalAppt: 5, totalRevenue: 50000 },
    ];

    const { result } = renderHook(() => useTotalCommissions(totals, barbers));

    // Lucas: 100000 * 0.5 = 50000
    // Marcos: 50000 * 0.4 = 20000
    // Total: 70000
    expect(result.current).toBe(70000);
  });

  it("debe retornar 0 si no hay barberos o totales", () => {
    const { result: res1 } = renderHook(() => useTotalCommissions([], barbers));
    expect(res1.current).toBe(0);

    const { result: res2 } = renderHook(() => useTotalCommissions([], []));
    expect(res2.current).toBe(0);
  });
});
