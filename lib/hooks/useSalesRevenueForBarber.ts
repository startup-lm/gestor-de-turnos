import { useEffect, useState } from "react";
import { getTotalRevenueForAllSales } from "@/lib/repository/sales";

interface BarberSalesAggRow {
  barberId: number;
  totalSales: number;
  totalSalesRevenue: number;
}

export function useSalesRevenueForBarber(
  barberId: number | null | undefined,
  startDate: Date,
  endDate: Date
) {
  const [totalSalesRevenue, setTotalSalesRevenue] = useState(0);
  const [totalSales, setTotalSales] = useState(0);

  useEffect(() => {
    let mounted = true;

    // si no hay barbero seleccionado, reseteamos
    if (!barberId) {
      setTotalSalesRevenue(0);
      setTotalSales(0);
      return;
    }

    (async () => {
      const data = (await getTotalRevenueForAllSales(
        startDate,
        endDate
      )) as BarberSalesAggRow[];

      if (!mounted) return;

      const row = data.find((r) => r.barberId === barberId);

      setTotalSalesRevenue(row?.totalSalesRevenue ?? 0);
      setTotalSales(row?.totalSales ?? 0);
    })();

    return () => {
      mounted = false;
    };
  }, [barberId, startDate, endDate]);

  return { totalSales, totalSalesRevenue };
}
