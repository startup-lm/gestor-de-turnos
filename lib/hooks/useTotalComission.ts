import { useMemo } from "react";
import { BarberTotals } from "./useBarberCutsdata";

/** Suma las comisiones por turnos que ya calculó el servidor con el % congelado de cada turno */
export function useTotalCommissions(barberTotals: BarberTotals[]): number {
  return useMemo(
    () => (barberTotals ?? []).reduce((sum, t) => sum + (t.totalCommission ?? 0), 0),
    [barberTotals]
  );
}
