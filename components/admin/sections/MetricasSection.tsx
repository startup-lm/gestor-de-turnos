"use client";

import React, { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { formatLocalDate } from "@/lib/dates/argentina";
import { useDashboardData, ViewMode } from "@/lib/hooks/useDashboardData";
import DashboardToolbar from "@/components/dashboard/DashboardToolbar";
import Metrics from "@/components/dashboard/Metrics";
import { ChartSkeleton, PieChartSkeleton, DashboardSkeleton } from "@/components/loading/Skeleton";
import { Barber } from "@/lib/types/Barbers";
import { useAuth } from "@/lib/auth/AuthContext";
import { useBarberCutsData } from "@/lib/hooks/useBarberCutsdata";
import { useSalesDashboardData } from "@/lib/hooks/useSalesDashboardData";
import { useTotalRevenueForAllSales } from "@/lib/hooks/useTotalSalesRevenue";

const ChartSection = dynamic(() => import("@/components/dashboard/ChartSection"), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});
const PieChartSection = dynamic(() => import("@/components/dashboard/PieChartSection"), {
  ssr: false,
  loading: () => <PieChartSkeleton />,
});

interface Props {
  initialBarbers: Barber[];
}

export default function MetricasSection({ initialBarbers }: Readonly<Props>) {
  const { barberId, role } = useAuth();
  const isAdmin = role === "admin";
  const activeBarbers = useMemo(() => initialBarbers.filter((b) => b.active !== false), [initialBarbers]);
  const barbers = isAdmin ? activeBarbers : activeBarbers.filter((b) => b.id === barberId);
  const [selectedBarberId, setSelectedBarberId] = useState(isAdmin ? 0 : barberId);

  // Inicialización de rango de fechas: "Este Mes"
  const initialDates = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return { start: startOfMonth, end: endOfMonth };
  }, []);

  const [startDate, setStartDate] = useState<Date>(initialDates.start);
  const [endDate, setEndDate] = useState<Date>(initialDates.end);
  const [viewMode, setViewMode] = useState<ViewMode>("day");

  // Hooks de turnos y cortes (una sola llamada)
  const {
    totalCount: turnosTotales,
    paidCount: turnosCobrados,
    totalRevenue: ingresosTotales,
    chartData,
    pastUnpaidCount,
  } = useDashboardData(selectedBarberId, startDate, endDate, viewMode);

  // Hooks de ventas de productos
  const { chartData: salesChartData } = useSalesDashboardData(selectedBarberId, startDate, endDate, viewMode);

  // Datos consolidados para comisiones globales y ventas por barbero
  const { pieData, barberTotals } = useBarberCutsData(startDate, endDate, barbers);
  const {
    totalSalesCommission,
    totalSales: allSalesCount,
    totalSalesRevenue: allSalesRevenue,
    salesByBarber,
  } = useTotalRevenueForAllSales(startDate, endDate);

  // Ventas y comisiones del barbero elegido (las comisiones vienen del servidor con el % congelado)
  const { ventasCount, ingresosVentas, comisionVentas } = useMemo(() => {
    if (selectedBarberId === -1) {
      return { ventasCount: 0, ingresosVentas: 0, comisionVentas: 0 };
    }
    if (selectedBarberId === 0) {
      return { ventasCount: allSalesCount, ingresosVentas: allSalesRevenue, comisionVentas: totalSalesCommission };
    }
    const barberSale = salesByBarber.find((s) => s.barberId === selectedBarberId);
    return {
      ventasCount: barberSale?.totalSales ?? 0,
      ingresosVentas: barberSale?.totalSalesRevenue ?? 0,
      comisionVentas: barberSale?.totalSalesCommission ?? 0,
    };
  }, [selectedBarberId, allSalesCount, allSalesRevenue, totalSalesCommission, salesByBarber]);
  const comisionCortes = barberTotals.find((t) => t.barberId === selectedBarberId)?.totalCommission ?? 0;

  const ingresos = ingresosTotales ?? 0;
  const pendientesHref = `/admin?tab=turnos&pendientes=1&desde=${formatLocalDate(startDate)}&hasta=${formatLocalDate(endDate)}${
    selectedBarberId > 0 ? `&barbero=${selectedBarberId}` : ""
  }`;

  const isDataLoading = turnosTotales === null;

  const handleBarberChange = useCallback((id: number) => {
    setSelectedBarberId(id);
  }, []);

  const handleDateChange = useCallback((range: { startDate: Date; endDate: Date }) => {
    setStartDate(range.startDate);
    setEndDate(range.endDate);
  }, []);

  const handleViewChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  if (isDataLoading) {
    return (
      <div className="w-full space-y-6">
        <div className="border-b border-white/10 pb-4 mb-2 animate-pulse">
          <div className="h-7 w-64 bg-slate-800/60 rounded-lg mb-2" />
          <div className="h-4 w-96 bg-slate-800/40 rounded-lg" />
        </div>
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Cabecera Principal */}
      <div className="border-b border-white/10 pb-4">
        <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
          Resumen
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          {isAdmin
            ? "Actividad del local: turnos, ventas de productos y reparto por profesional. Los montos están en Balance"
            : "Tus turnos realizados, ventas generadas y comisiones acumuladas"}
        </p>
      </div>

      {/* Toolbar Superior Unificada: Selector de Barbero + Presets Rápidos */}
      <DashboardToolbar
        barbers={barbers}
        selectedBarberId={selectedBarberId}
        onBarberChange={handleBarberChange}
        startDate={startDate}
        endDate={endDate}
        onDateChange={handleDateChange}
        showAll={isAdmin}
      />

      {/* Turnos que ya pasaron y nadie cobró (incluye clientes que no vinieron) */}
      {pastUnpaidCount > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/25">
          <div className="flex items-start gap-2.5 text-sm text-amber-200">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-400" />
            <span>
              {pastUnpaidCount === 1
                ? "Tenés 1 turno pasado sin cobrar en este período"
                : `Tenés ${pastUnpaidCount} turnos pasados sin cobrar en este período`}
            </span>
          </div>
          <Link
            href={pendientesHref}
            className="inline-flex items-center justify-center gap-1.5 px-4 min-h-[44px] rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-200 text-sm font-semibold transition-colors self-start sm:self-auto"
          >
            <span>Ver turnos</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* KPIs de actividad */}
      <Metrics
        turnos={turnosCobrados}
        turnosAgendados={turnosTotales ?? 0}
        ventas={ventasCount}
        ingresos={ingresos}
        gananciaCortes={comisionCortes}
        gananciaVentas={comisionVentas}
        ingresosVentas={ingresosVentas}
      />

      {/* Gráfico de Evolución Temporal */}
      <div className="w-full">
        <ChartSection
          data={chartData}
          salesData={salesChartData}
          viewMode={viewMode}
          onViewChange={handleViewChange}
        />
      </div>

      {/* Distribución por Barbero (Exclusivo Admin) */}
      {isAdmin && (
        <div className="w-full">
          <PieChartSection data={pieData} />
        </div>
      )}
    </div>
  );
}