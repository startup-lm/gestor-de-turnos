import { useState, useEffect } from "react";
import { getTotalRevenueForAllSales } from "@/lib/repository/sales";
import { Barber } from "@/lib/types/Barbers";

export interface TotalSalesData {
  totalSales: number;
  totalSalesRevenue: number;
  totalSalesCommission: number;
  salesByBarber: Array<{ barberId: number; totalSales: number; totalSalesRevenue: number }>;
}

export function useTotalRevenueForAllSales(startDate: Date, endDate: Date, barbers: Barber[] ): TotalSalesData {
  const [totalSalesRevenue, setTotalSalesRevenue] = useState<number>(0);
  const [totalSales, setTotalSales] = useState<number>(0);
  const [totalSalesCommission, setTotalSalesCommission] = useState<number>(0);
  const [salesByBarber, setSalesByBarber] = useState<Array<{ barberId: number; totalSales: number; totalSalesRevenue: number }>>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const data = await getTotalRevenueForAllSales(startDate, endDate);
      if (!mounted) return;
      const total = data.reduce(
        (sum: number, sale: { totalSalesRevenue: number }) =>
          sum + sale.totalSalesRevenue,
        0
      );

      const salesCount = data.reduce(
        (sum: number, sale: { totalSales: number }) => sum + sale.totalSales,
        0
      );

      const salesCommission = data.reduce(
        (
          sum: number,
          sale: { barberId: number; totalSalesRevenue: number }
        ) => {
          const barber = barbers.find((b) => b.id === sale.barberId);
          const rate = barber?.sale_commission ?? 0;
          return sum + sale.totalSalesRevenue * rate;
        },
        0
      );

      setTotalSalesRevenue(total);
      setTotalSales(salesCount);
      setTotalSalesCommission(salesCommission);
      setSalesByBarber(data ?? []);
    })();

    return () => {
      mounted = false;
    };
  }, [startDate, endDate, barbers]);

  return { totalSales, totalSalesRevenue, totalSalesCommission, salesByBarber };
}