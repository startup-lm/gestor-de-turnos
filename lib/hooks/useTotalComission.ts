import { useMemo } from "react";
import { Barber } from "@/lib/types/Barbers";
import { BarberTotals } from "./useBarberCutsdata";

export function useTotalCommissions(barberTotals: BarberTotals[], barbers: Barber[]): number {
  return useMemo(() => {
    if (!barberTotals || barberTotals.length === 0 || !barbers || barbers.length === 0) {
      return 0;
    }
    return barberTotals.reduce((sum, t) => {
      const barber = barbers.find((b) => b.id === t.barberId);
      const rate = barber?.commission ?? 0;
      return sum + t.totalRevenue * rate;
    }, 0);
  }, [barberTotals, barbers]);
}

