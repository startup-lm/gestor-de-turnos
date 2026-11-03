"use client";

import React, { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { useDashboardData, ViewMode } from "@/lib/hooks/useDashboardData";
import DashboardToolbar from "@/components/dashboard/DashboardToolbar";
import Metrics from "@/components/dashboard/Metrics";
import { ChartSkeleton, PieChartSkeleton, DashboardSkeleton } from "@/components/loading/Skeleton";
import { Barber } from "@/lib/types/Barbers";
import { useAuth } from "@/lib/auth/AuthContext";
import { useBarberCutsData } from "@/lib/hooks/useBarberCutsdata";
import { useSalesDashboardData } from "@/lib/hooks/useSalesDashboardData";
import { useTotalRevenueForAllSales } from "@/lib/hooks/useTotalSalesRevenue";
import { useTotalCommissions } from "@/lib/hooks/useTotalComission";

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
  const { totalCount: turnosTotales, paidCount: turnosCobrados, totalRevenue: ingresosTotales, chartData } =
    useDashboardData(selectedBarberId, startDate, endDate, viewMode);

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
  const totalCutsCommission = useTotalCommissions(barberTotals);
  const totalCommissionsAll = totalCutsCommission + totalSalesCommission;

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
  const selectedBarber = barbers.find((b) => b.id === selectedBarberId);
  const comision = selectedBarber?.commission ?? 0;

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
          Métricas
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          {isAdmin
            ? "Rendimiento del negocio, volumen de servicios, ventas de productos y métricas por profesional"
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

      {/* 4 KPIs Ejecutivos */}
      <Metrics
        turnos={turnosCobrados}
        turnosAgendados={turnosTotales ?? 0}
        ventas={ventasCount}
        ingresos={ingresos}
        comision={comision}
        gananciaCortes={comisionCortes}
        gananciaVentas={comisionVentas}
        ingresosVentas={ingresosVentas}
        selectedBarberId={selectedBarberId}
        totalCommissionsAll={totalCommissionsAll}
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