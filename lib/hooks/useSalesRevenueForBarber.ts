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

    // si es inválido (ej: -1 o no definido), reseteamos
    if (barberId === undefined || barberId === null || barberId === -1) {
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

      if (barberId === 0) {
        // Todos los barberos
        const totalRev = data.reduce((acc, curr) => acc + (curr.totalSalesRevenue ?? 0), 0);
        const totalCount = data.reduce((acc, curr) => acc + (curr.totalSales ?? 0), 0);
        setTotalSalesRevenue(totalRev);
        setTotalSales(totalCount);
      } else {
        const row = data.find((r) => r.barberId === barberId);
        setTotalSalesRevenue(row?.totalSalesRevenue ?? 0);
        setTotalSales(row?.totalSales ?? 0);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [barberId, startDate, endDate]);

  return { totalSales, totalSalesRevenue };
}
