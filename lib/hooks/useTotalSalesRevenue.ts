import { useState, useEffect } from "react";
import { getTotalRevenueForAllSales } from "@/lib/repository/sales";

export interface BarberSalesTotals {
  barberId: number;
  totalSales: number;
  totalSalesRevenue: number;
  /** Comisión calculada en el servidor con el % congelado al vender */
  totalSalesCommission: number;
}

export interface TotalSalesData {
  totalSales: number;
  totalSalesRevenue: number;
  totalSalesCommission: number;
  salesByBarber: BarberSalesTotals[];
}

export function useTotalRevenueForAllSales(startDate: Date, endDate: Date): TotalSalesData {
  const [totalSalesRevenue, setTotalSalesRevenue] = useState<number>(0);
  const [totalSales, setTotalSales] = useState<number>(0);
  const [totalSalesCommission, setTotalSalesCommission] = useState<number>(0);
  const [salesByBarber, setSalesByBarber] = useState<BarberSalesTotals[]>([]);

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
        (sum: number, sale: { totalSalesCommission?: number }) => sum + (sale.totalSalesCommission ?? 0),
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
  }, [startDate, endDate]);

  return { totalSales, totalSalesRevenue, totalSalesCommission, salesByBarber };
}