import { useState, useEffect } from "react";
import { getBarbersAppointmentsFromDates } from "@/lib/repository/appointments";

export type ViewMode = "day" | "week" | "month";
export type DataType = "count" | "revenue";

export interface DataPoint {
  date: string;
  label: string;
  count: number;
  revenue: number;
}

const getMonday = (date: Date) => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
};

export function useDashboardData(
  barberId: number,
  startDate: Date,
  endDate: Date,
  viewMode: ViewMode,
  dataType: DataType
) {
  const [total, setTotal] = useState<number | null>(null);
  const [chartData, setChartData] = useState<DataPoint[]>([]);

  useEffect(() => {
    if (barberId === -1) {
      setTotal(null);
      setChartData([]);
      return;
    }

    (async () => {
      const allAppt = await getBarbersAppointmentsFromDates(barberId, startDate, endDate);
      const all = allAppt.filter(appt => appt.phone !== "0000000000");

      const tot = dataType === "revenue" ? all.reduce((sum, a) => sum + (a.price ?? 0), 0) : all.length;
      setTotal(tot);

      const grouped: Record<string, { count: number; revenue: number; label: string }> = {};

      all.forEach((appt) => {
        const dateObj = new Date(appt.date + "T00:00:00");

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
          label = `${startDay}-${endDay} ${month.charAt(0).toUpperCase() + month.slice(1)}`;
        } else {
          const year = dateObj.getFullYear();
          const month = dateObj.toLocaleDateString("es-AR", { month: "long" });
          key = `${year}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;
          label = `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
        }

        const price = appt.price || 0;
        if (grouped[key]) {
          grouped[key].count += 1;
          grouped[key].revenue += price;
        } else {
          grouped[key] = { count: 1, revenue: price, label };
        }
      });

      const dataPoints = Object.entries(grouped)
        .map(([date, { count, revenue, label }]) => ({ date, count, revenue, label }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setChartData(dataPoints);
    })();
  }, [barberId, startDate, endDate, viewMode, dataType]);

  return { total, chartData };
}