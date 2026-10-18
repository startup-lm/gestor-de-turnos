"use client";

import React, { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { useDashboardData, ViewMode } from "@/lib/hooks/useDashboardData";
import Sidebar from "@/components/dashboard/Sidebar";
import Spinner from "@/components/loading/Spinner";
import { Barber } from "@/lib/types/Barbers";
import { useAuth } from "@/lib/auth/AuthContext";
import { useBarberCutsData } from "@/lib/hooks/useBarberCutsdata";
import { useSalesRevenueForBarber } from "@/lib/hooks/useSalesRevenueForBarber";
import { useSalesDashboardData } from "@/lib/hooks/useSalesDashboardData";

const ChartSection = dynamic(() => import("@/components/dashboard/ChartSection"), { ssr: false, loading: () => <Spinner />, });
const PieChartSection = dynamic(() => import("@/components/dashboard/PieChartSection"), { ssr: false, loading: () => <Spinner />, });

interface Props {
  initialBarbers: Barber[];
}

export default function DashboardClient({ initialBarbers }: Readonly<Props>) {
  const { barberId, role } = useAuth();
  const barbers = role === "admin" ? initialBarbers : initialBarbers.filter(b => b.id === barberId);
  const [selectedBarberId, setSelectedBarberId] = useState(role === "admin" ? 0 : barberId);
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
  const { chartData: salesChartData } = useSalesDashboardData(selectedBarberId, startDate, endDate, viewMode);
  const turnos = turnosTotales ?? 0;
  const ingresos = ingresosTotales ?? 0;
  const comision = barbers.find(b => b.id === selectedBarberId)?.commission ?? 0;
  const comisionVenta = barbers.find(b => b.id === selectedBarberId)?.sale_commission ?? 0;
  const { totalSalesRevenue: ingresosVentas, totalSales: ventasCount, } = useSalesRevenueForBarber(selectedBarberId, startDate, endDate);
  const { pieData } = useBarberCutsData(startDate, endDate);

  const isDataLoading = turnosTotales === null;

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

  if (isDataLoading) {
    return (
      <div className="w-full space-y-6">
        <div className="border-b border-slate-800/40 pb-4 mb-2">
          <div className="h-7 w-64 bg-slate-800/60 rounded-lg mb-2 animate-pulse" />
          <div className="h-4 w-96 bg-slate-800/40 rounded-lg animate-pulse" />
        </div>
        <div className="flex flex-col xl:flex-row gap-6 items-stretch">
          <div className="w-full xl:w-[280px] 2xl:w-[300px] h-[480px] bg-slate-900/40 rounded-2xl border border-slate-800/60 p-6 flex flex-col items-center justify-center">
            <Spinner />
            <p className="text-xs text-slate-500 mt-3 font-medium">Cargando filtros...</p>
          </div>
          <div className="flex-1 min-h-[480px] bg-slate-900/40 rounded-2xl border border-slate-800/60 flex flex-col items-center justify-center p-8">
            <Spinner />
            <p className="text-sm text-[var(--foreground)]/70 mt-3 font-medium tracking-wide">
              Cargando métricas y estadísticas...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Cabecera de la sección */}
      <div className="border-b border-slate-800/40 pb-4 mb-2">
        <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
          Panel de Control y Métricas
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          {role === "admin"
            ? "Evolución temporal de turnos, productos vendidos y distribución por barbero"
            : "Tus turnos realizados y comisiones generadas"}
        </p>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 items-stretch">
        <aside className="w-full xl:w-[280px] 2xl:w-[300px] flex-shrink-0">
          <Sidebar
            barbers={barbers}
            selectedBarberId={selectedBarberId}
            onBarberChange={handleBarberChange}
            startDate={startDate}
            endDate={endDate}
            onDateChange={handleDateChange}
            showAll={role === "admin"}
          />
        </aside>

        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <ChartSection
            data={chartData}
            salesData={salesChartData}
            viewMode={viewMode}
            onViewChange={handleViewChange}
            turnos={turnos}
            ventas={ventasCount}
            ingresos={ingresos}
            comision={comision}
            comisionVenta={comisionVenta}
            ingresosVentas={ingresosVentas} 
          />
        </div>
      </div>

      {role === "admin" && (
        <div className="mt-4">
          <section className="w-full">
            <PieChartSection data={pieData} />
          </section>
        </div>
      )}
    </div>
  );
}