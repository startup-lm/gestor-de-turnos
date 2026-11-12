import { useEffect, useState, useMemo, useRef } from "react";
import { getBarberSalesFromDates } from "@/lib/repository/sales";
import { ViewMode, DataPoint } from "./useDashboardData";
import { parseISO } from "date-fns";
import { formatLocalDate } from "@/lib/dates/argentina";

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sales, setSales] = useState<any[]>([]);

  const rangeRef = useRef({ startDate, endDate });
  rangeRef.current = { startDate, endDate };

  const startIso = startDate.toISOString().slice(0, 10);
  const endIso = endDate.toISOString().slice(0, 10);

  useEffect(() => {
    if (barberId === -1) {
      setSales([]);
      return;
    }

    let mounted = true;
    (async () => {
      const allSales = await getBarberSalesFromDates(barberId, rangeRef.current.startDate, rangeRef.current.endDate);
      if (!mounted) return;
      setSales(allSales || []);
    })();

    return () => {
      mounted = false;
    };
  }, [barberId, startIso, endIso]);

  const chartData: DataPoint[] = useMemo(() => {
    if (barberId === -1 || sales.length === 0) return [];

    const grouped: Record<string, { count: number; revenue: number; label: string }> = {};

    sales.forEach((sale) => {
      const dateObj = parseISO(sale.created_at.slice(0, 10));

      let key: string;
      let label: string;

      if (viewMode === "day") {
        key = sale.created_at.slice(0, 10);
        const day = dateObj.getDate();
        const month = dateObj.getMonth() + 1;
        label = `${day}/${month}`;
      } else if (viewMode === "week") {
        const monday = getMonday(new Date(dateObj));
        const sunday = new Date(monday);
        sunday.setDate(sunday.getDate() + 6);

        key = formatLocalDate(monday);
        const startDay = monday.getDate();
        const endDay = sunday.getDate();
        const month = sunday.toLocaleDateString("es-AR", { month: "long" });
        label = `${startDay}-${endDay} ${month.charAt(0).toUpperCase() + month.slice(1)}`;
      } else {
        const year = dateObj.getFullYear();
        const month = dateObj.toLocaleDateString("es-AR", { month: "long" });
        key = `${year}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;
        label = `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
      }

      const total = sale.total || 0;

      if (grouped[key]) {
        grouped[key].count += 1;
        grouped[key].revenue += total;
      } else {
        grouped[key] = { count: 1, revenue: total, label };
      }
    });

    return Object.entries(grouped)
      .map(([date, { count, revenue, label }]) => ({
        date,
        count,
        revenue,
        label,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [sales, barberId, viewMode]);

  return { chartData };
}
