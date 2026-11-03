import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useTotalCommissions } from "@/lib/hooks/useTotalComission";
import { BarberTotals } from "@/lib/hooks/useBarberCutsdata";

describe("useTotalCommissions", () => {
  it("suma las comisiones calculadas por el servidor con el % congelado", () => {
    // Lucas cobró con 50% y Marcos con 40%: el hook no recalcula con el % actual
    const totals: BarberTotals[] = [
      { barberId: 1, totalAppt: 10, totalRevenue: 100000, totalCommission: 50000 },
      { barberId: 2, totalAppt: 5, totalRevenue: 50000, totalCommission: 20000 },
    ];

    const { result } = renderHook(() => useTotalCommissions(totals));
    expect(result.current).toBe(70000);
  });

  it("devuelve 0 si no hay totales", () => {
    const { result } = renderHook(() => useTotalCommissions([]));
    expect(result.current).toBe(0);
  });
});
