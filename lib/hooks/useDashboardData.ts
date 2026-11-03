import { useState, useEffect, useMemo } from "react";
import { getBarbersAppointmentsFromDates } from "@/lib/repository/appointments";
import { Appointment } from "@/lib/types/Appointment";

export type ViewMode = "day" | "week" | "month";

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
  viewMode: ViewMode
) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const startIso = startDate.toISOString().slice(0, 10);
  const endIso = endDate.toISOString().slice(0, 10);

  useEffect(() => {
    if (barberId === -1) {
      setAppointments([]);
      return;
    }

    let mounted = true;
    (async () => {
      const allAppt = await getBarbersAppointmentsFromDates(barberId, startDate, endDate);
      if (!mounted) return;
      const valid = allAppt.filter((appt) => appt.phone !== "0000000000");
      setAppointments(valid);
    })();

    return () => {
      mounted = false;
    };
  }, [barberId, startIso, endIso]);

  const { totalCount, paidCount, totalRevenue, chartData } = useMemo(() => {
    if (barberId === -1 || appointments.length === 0) {
      return {
        totalCount: barberId === -1 ? null : 0,
        paidCount: 0,
        totalRevenue: barberId === -1 ? null : 0,
        chartData: [],
      };
    }

    const count = appointments.length;
    const paidAppointments = appointments.filter((a) => a.paid === true);
    const revenue = paidAppointments.reduce((sum, a) => sum + (a.price ?? 0), 0);

    const grouped: Record<string, { count: number; revenue: number; label: string }> = {};

    appointments.forEach((appt) => {
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

      const price = appt.paid ? (appt.price || 0) : 0;
      if (grouped[key]) {
        grouped[key].count += 1;
        grouped[key].revenue += price;
      } else {
        grouped[key] = { count: 1, revenue: price, label };
      }
    });

    const dataPoints: DataPoint[] = Object.entries(grouped)
      .map(([date, { count, revenue, label }]) => ({ date, count, revenue, label }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { totalCount: count, paidCount: paidAppointments.length, totalRevenue: revenue, chartData: dataPoints };
  }, [appointments, barberId, viewMode]);

  // totalCount: todos los turnos agendados; paidCount: solo los cobrados (los que suman a la facturación)
  return { totalCount, paidCount, totalRevenue, chartData };
}
