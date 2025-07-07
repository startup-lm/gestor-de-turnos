import { useState, useEffect } from "react";
import { getTotalRevenueForAllSales } from "@/lib/repository/sales";

export interface TotalSalesData {
  totalSales: number;
  totalSalesRevenue: number;
}

export function useTotalRevenueForAllSales(startDate: Date, endDate: Date): TotalSalesData {
  const [totalSalesRevenue, setTotalSalesRevenue] = useState<number>(0);
  const [totalSales, setTotalSales] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const data = await getTotalRevenueForAllSales(startDate, endDate);
      if (!mounted) return;

      const total = data.reduce((sum: number, sale: { totalSalesRevenue: number }) => {
        return sum + sale.totalSalesRevenue;
      }, 0);

      const salesCount = data.reduce(
        (sum: number, sale: { totalSales: number }) => sum + sale.totalSales,
        0
      );

      setTotalSalesRevenue(total);
      setTotalSales(salesCount);
    })();

    return () => {
      mounted = false;
    };
  }, [startDate, endDate]);

  return { totalSales, totalSalesRevenue} ;
}
