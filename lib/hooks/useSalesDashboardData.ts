import { useEffect, useState } from "react";
import { getBarberSalesFromDates } from "@/lib/repository/sales";
import { ViewMode, DataPoint } from "./useDashboardData";

const getMonday = (date: Date) => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
};

export function useSalesDashboardData(
  barberId: number,
  startDate: Date,
  endDate: Date,
  viewMode: ViewMode
) {
  const [chartData, setChartData] = useState<DataPoint[]>([]);

  useEffect(() => {
    if (barberId === -1) {
      setChartData([]);
      return;
    }

    (async () => {
      const allSales = await getBarberSalesFromDates(barberId, startDate, endDate);

      const grouped: Record<string, { count: number; revenue: number; label: string }> = {};

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (allSales as any[]).forEach((sale) => {
        const dateObj = new Date(sale.created_at);

        let key: string;
        let label: string;

        if (viewMode === "day") {
          key = dateObj.toISOString().slice(0, 10);
          const day = dateObj.getDate();
          const month = dateObj.getMonth() + 1;
          label = `${day}/${month}`;
        } else if (viewMode === "week") {
          const monday = getMonday(new Date(dateObj));
          const sunday = new Date(monday);
          sunday.setDate(sunday.getDate() + 6);

          key = monday.toISOString().slice(0, 10);
          const startDay = monday.getDate();
          const endDay = sunday.getDate();
          const month = sunday.toLocaleDateString("es-AR", { month: "long" });
          label = `${startDay}-${endDay} ${
            month.charAt(0).toUpperCase() + month.slice(1)
          }`;
        } else {
          const year = dateObj.getFullYear();
          const month = dateObj.toLocaleDateString("es-AR", { month: "long" });
          key = `${year}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;
          label = `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
        }

        const total = sale.total || 0;

        if (grouped[key]) {
          grouped[key].count += 1;        // nº de ventas (o podés usar quantity)
          grouped[key].revenue += total;  // facturación de ventas
        } else {
          grouped[key] = { count: 1, revenue: total, label };
        }
      });

      const dataPoints: DataPoint[] = Object.entries(grouped)
        .map(([date, { count, revenue, label }]) => ({
          date,
          count,
          revenue,
          label,
        }))
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

      setChartData(dataPoints);
    })();
  }, [barberId, startDate, endDate, viewMode]);

  return { chartData };
}
