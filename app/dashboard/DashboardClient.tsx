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
import { useSalesRevenueForBarber } from "@/lib/hooks/useSalesRevenueForBarber";
import { useTotalCommissions } from "@/lib/hooks/useTotalComission";
import Summary from "@/components/dashboard/Summary";
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
  const { summary, pieData, paymentTotals } = useBarberCutsData(startDate, endDate);
  const { totalSalesRevenue, totalSales, totalSalesCommission } = useTotalRevenueForAllSales(startDate, endDate, barbers);
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
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-8 min-h-screen">
      {/* Cabecera Premium Centrada */}
      <div className="text-center border-b border-slate-800/40 pb-6 mb-6">
        <h1 className="text-3xl font-extrabold text-white tracking-tight bg-gradient-to-r from-white via-white to-[var(--accent)] bg-clip-text text-transparent block w-fit mx-auto text-center">
          Panel de Control
        </h1>
      </div>


      <div className="flex flex-col md:flex-row gap-6 items-stretch">
        <aside className="flex-none">
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

        <main className="flex-1 self-stretch flex flex-col relative min-w-0">
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
        </main>
      </div>

      {role === "admin" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
          <section className="w-full">
            <Summary data={summary} salesData={{totalSales, totalSalesRevenue, totalSalesCommission}} totalCommissions={totalCommissions} paymentTotals={paymentTotals} />
          </section>

          <section className="w-full">
            <PieChartSection data={pieData} />
          </section>
        </div>
      )}
    </div>
  );
}