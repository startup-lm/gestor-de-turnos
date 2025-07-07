"use client";

import React, { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { useDashboardData, ViewMode } from "@/lib/hooks/useDashboardData";
import Sidebar from "@/components/dashboard/Sidebar";
import Spinner from "@/components/loading/Spinner";
import { Barber } from "@/lib/types/Barbers";
import { useAuth } from "@/lib/auth/AuthContext";
import { useBarberCutsData } from "@/lib/hooks/useBarberCutsdata";
import { useTotalRevenueForAllSales } from "@/lib/hooks/useTotalSalesRevenue";
import { useTotalCommissions } from "@/lib/hooks/useTotalComission";
import Summary from "@/components/dashboard/Summary";

const ChartSection = dynamic(() => import("@/components/dashboard/ChartSection"), { ssr: false, loading: () => <Spinner />, });
const PieChartSection = dynamic(() => import("@/components/dashboard/PieChartSection"), { ssr: false, loading: () => <Spinner />, });

interface Props {
  initialBarbers: Barber[];
}

export default function DashboardClient({ initialBarbers }: Readonly<Props>) {
  const { barberId, role } = useAuth();
  const barbers = role === "admin" ? initialBarbers : initialBarbers.filter(b => b.id === barberId);
  const [selectedBarberId, setSelectedBarberId] = useState(barberId);
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(13, 0, 0, 0);
    return { start: d, end: d };
  }, []);
  const [startDate, setStartDate] = useState<Date>(today.start);
  const [endDate, setEndDate] = useState<Date>(today.end);
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const { total: turnosTotales, chartData } = useDashboardData(selectedBarberId, startDate, endDate, viewMode, "count");
  const { total: ingresosTotales } = useDashboardData(selectedBarberId, startDate, endDate, viewMode, "revenue");
  const turnos = turnosTotales ?? 0;
  const ingresos = ingresosTotales ?? 0;
  const comision = barbers.find(b => b.id === selectedBarberId)?.commission ?? 0;
  const { summary, pieData } = useBarberCutsData(startDate, endDate);
  const { totalSalesRevenue, totalSales } = useTotalRevenueForAllSales(startDate, endDate);
  const totalCommissions = useTotalCommissions(startDate, endDate);

  const handleBarberChange = useCallback((id: number) => {
    setSelectedBarberId(id);
  }, []);

  const handleDateChange = useCallback(
    (range: { startDate: Date; endDate: Date }) => {
      setStartDate(range.startDate);
      setEndDate(range.endDate);
    },
    []
  );

  const handleViewChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-center">Dashboard</h1>

      <div className="flex flex-col md:flex-row gap-2 items-stretch">
        <aside className="flex-none">
          <Sidebar
            barbers={barbers}
            selectedBarberId={selectedBarberId}
            onBarberChange={handleBarberChange}
            startDate={startDate}
            endDate={endDate}
            onDateChange={handleDateChange}
          />
        </aside>

        <main className="flex-1 self-stretch flex flex-col relative">
          <ChartSection
            data={chartData}
            viewMode={viewMode}
            onViewChange={handleViewChange}
            turnos={turnos}
            ingresos={ingresos}
            comision={comision}
          />
        </main>
      </div>

      {role === "admin" && (
        <div className="flex flex-col md:flex-row gap-4 mt-10">
          <section className="w-full md:w-1/2">
            <Summary data={summary} salesData={{totalSales, totalSalesRevenue}} totalCommissions={totalCommissions} />
          </section>

          <section className="w-full md:w-1/2">
            <PieChartSection data={pieData} />
          </section>
        </div>
      )}
    </div>
  )
}