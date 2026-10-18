"use client";

import React, { useState, useMemo } from "react";
import CountUp from "react-countup";
import { Barber } from "@/lib/types/Barbers";
import { useBarberCutsData } from "@/lib/hooks/useBarberCutsdata";
import { useTotalRevenueForAllSales } from "@/lib/hooks/useTotalSalesRevenue";
import { useTotalCommissions } from "@/lib/hooks/useTotalComission";
import DateRangeCalendar from "@/components/dashboard/DateRangeCalendar";
import {
  Wallet,
  Coins,
  TrendingUp,
  CreditCard,
  Scissors,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Calendar,
  Users,
  Percent,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Props {
  barbers: Barber[];
}

type DatePreset = "today" | "week" | "month" | "last_month" | "custom";

export default function FinanzasSection({ barbers }: Readonly<Props>) {
  // Preset inicial: "Este Mes"
  const [preset, setPreset] = useState<DatePreset>("month");
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  // Rangos de fecha
  const initialDates = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    return { start: startOfMonth, end: endOfDay };
  }, []);

  const [startDate, setStartDate] = useState<Date>(initialDates.start);
  const [endDate, setEndDate] = useState<Date>(initialDates.end);

  // Manejo de presets
  const handleSelectPreset = (p: DatePreset) => {
    setPreset(p);
    const now = new Date();

    if (p === "today") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      setStartDate(start);
      setEndDate(end);
      setShowCustomPicker(false);
    } else if (p === "week") {
      const currentDay = now.getDay();
      const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      monday.setHours(0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      setStartDate(monday);
      setEndDate(end);
      setShowCustomPicker(false);
    } else if (p === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      setStartDate(start);
      setEndDate(end);
      setShowCustomPicker(false);
    } else if (p === "last_month") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      setStartDate(start);
      setEndDate(end);
      setShowCustomPicker(false);
    } else if (p === "custom") {
      setShowCustomPicker(true);
    }
  };

  const handleDateChange = (range: { startDate: Date; endDate: Date }) => {
    setStartDate(range.startDate);
    setEndDate(range.endDate);
    setPreset("custom");
  };

  // Obtener datos consolidados
  const { summary, paymentTotals, barberTotals } = useBarberCutsData(startDate, endDate);
  const { totalSalesRevenue, totalSales, totalSalesCommission } = useTotalRevenueForAllSales(startDate, endDate, barbers);
  const totalCommissions = useTotalCommissions(startDate, endDate);

  // Cálculos financieros
  const totalTurnosRevenue = summary.totalRevenue;
  const combinedRevenue = totalTurnosRevenue + totalSalesRevenue;
  const totalCommissionsAll = totalCommissions + totalSalesCommission;
  const netProfit = combinedRevenue - totalCommissionsAll;
  const isNegative = netProfit < 0;

  const profitMargin = combinedRevenue > 0 ? ((netProfit / combinedRevenue) * 100).toFixed(1) : "0";

  // Participación de pagos
  const efectivoAmount = paymentTotals?.Efectivo ?? 0;
  const mercadoPagoAmount = paymentTotals?.MercadoPago ?? 0;
  const totalPagosTurnos = efectivoAmount + mercadoPagoAmount + (paymentTotals?.Otros ?? 0);
  const efectivoPercent = totalPagosTurnos > 0 ? Math.round((efectivoAmount / totalPagosTurnos) * 100) : 0;
  const mpPercent = totalPagosTurnos > 0 ? Math.round((mercadoPagoAmount / totalPagosTurnos) * 100) : 0;

  // Formato de texto de rango
  const formattedRange = useMemo(() => {
    const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
    return `${startDate.toLocaleDateString("es-AR", opts)} — ${endDate.toLocaleDateString("es-AR", opts)}`;
  }, [startDate, endDate]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Cabecera Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Wallet className="w-6 h-6 text-[var(--accent)]" />
            <span>Finanzas y balance de caja</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Estado de resultados, comisiones por liquidar, ganancia neta y medios de pago
          </p>
        </div>

        {/* Selector de Presets de Fecha */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-900/60 border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => handleSelectPreset("today")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                preset === "today"
                  ? "!bg-[var(--accent)] !text-slate-950 font-bold shadow-sm"
                  : "!text-slate-400 hover:!text-white hover:!bg-white/5"
              }`}
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset("week")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                preset === "week"
                  ? "!bg-[var(--accent)] !text-slate-950 font-bold shadow-sm"
                  : "!text-slate-400 hover:!text-white hover:!bg-white/5"
              }`}
            >
              Esta Semana
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset("month")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                preset === "month"
                  ? "!bg-[var(--accent)] !text-slate-950 font-bold shadow-sm"
                  : "!text-slate-400 hover:!text-white hover:!bg-white/5"
              }`}
            >
              Este Mes
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset("last_month")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer hidden sm:inline-block ${
                preset === "last_month"
                  ? "!bg-[var(--accent)] !text-slate-950 font-bold shadow-sm"
                  : "!text-slate-400 hover:!text-white hover:!bg-white/5"
              }`}
            >
              Mes Pasado
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset("custom")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                preset === "custom"
                  ? "!bg-[var(--accent)] !text-slate-950 font-bold shadow-sm"
                  : "!text-slate-400 hover:!text-white hover:!bg-white/5"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Personalizado</span>
              {showCustomPicker ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>

      {/* Rango Activo & Selector Calendario Desplegable */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-400 gap-2 bg-slate-900/40 p-3 rounded-xl border border-white/5">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[var(--accent)]" />
          <span>Período consultado:</span>
          <span className="font-semibold text-white capitalize">{formattedRange}</span>
        </div>
        {preset !== "custom" && (
          <button
            type="button"
            onClick={() => setShowCustomPicker(!showCustomPicker)}
            className="text-[var(--accent)] hover:underline flex items-center gap-1 cursor-pointer"
          >
            {showCustomPicker ? "Ocultar calendario" : "Ajustar fechas exactas"}
          </button>
        )}
      </div>

      {showCustomPicker && (
        <div className="dashboard-card p-4 max-w-sm border border-[var(--accent)]/30 animate-in fade-in slide-in-from-top-2 duration-200">
          <DateRangeCalendar
            startDate={startDate}
            endDate={endDate}
            onChange={handleDateChange}
          />
        </div>
      )}

      {/* 4 KPIs Financieros Clave */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Ganancia Neta */}
        <div
          className={`kpi-card ${
            isNegative ? "kpi-card--negative bg-red-950/10" : "kpi-card--net bg-emerald-950/10"
          } flex flex-col justify-between gap-4 p-5 min-w-0`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1.5">
                Ganancia Neta
              </span>
              <h3 className={`text-2xl lg:text-3xl font-extrabold ${isNegative ? "text-red-400" : "text-emerald-400"}`}>
                <CountUp start={0} end={netProfit} duration={2} prefix="$" separator="." />
              </h3>
            </div>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner flex-shrink-0 ${
                isNegative
                  ? "bg-red-500/10 border-red-500/25 text-red-400"
                  : "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
              }`}
            >
              {isNegative ? <AlertTriangle className="w-5 h-5" /> : <Coins className="w-5 h-5" />}
            </div>
          </div>

          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
            <span
              className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded-md border ${
                isNegative
                  ? "bg-red-500/10 border-red-500/30 text-red-400"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              }`}
            >
              {isNegative ? "Saldo Deudor" : "Superávit"}
            </span>
            <span className="text-slate-400 text-[11px] font-medium">Margen: {profitMargin}%</span>
          </div>
        </div>

        {/* KPI 2: Ingresos Brutos */}
        <div className="kpi-card kpi-card--revenue flex flex-col justify-between gap-4 p-5 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1.5">
                Ingresos Brutos
              </span>
              <h3 className="text-2xl lg:text-3xl font-extrabold text-white">
                <CountUp start={0} end={combinedRevenue} duration={2} prefix="$" separator="." />
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-400 shadow-inner flex-shrink-0">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>

          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span>Cortes: ${totalTurnosRevenue.toLocaleString("es-AR")}</span>
            <span>Ventas: ${totalSalesRevenue.toLocaleString("es-AR")}</span>
          </div>
        </div>

        {/* KPI 3: Egresos en Comisiones */}
        <div className="kpi-card kpi-card--negative flex flex-col justify-between gap-4 p-5 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1.5">
                Comisiones a Pagar
              </span>
              <h3 className="text-2xl lg:text-3xl font-extrabold text-red-400">
                <CountUp start={0} end={totalCommissionsAll} duration={2} prefix="$" separator="." />
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-400 shadow-inner flex-shrink-0">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>

          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span>Por Turnos: ${Math.round(totalCommissions).toLocaleString("es-AR")}</span>
            <span>Por Ventas: ${Math.round(totalSalesCommission).toLocaleString("es-AR")}</span>
          </div>
        </div>

        {/* KPI 4: Volumen Operativo */}
        <div className="kpi-card kpi-card--sales flex flex-col justify-between gap-4 p-5 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1.5">
                Operaciones Totales
              </span>
              <h3 className="text-2xl lg:text-3xl font-extrabold text-white">
                <CountUp start={0} end={summary.totalAppt + totalSales} duration={2} separator="." />
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center border border-sky-500/20 text-sky-400 shadow-inner flex-shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span>{summary.totalAppt} cortes</span>
            <span>{totalSales} productos</span>
          </div>
        </div>
      </div>

      {/* Sección Doble: Medios de Pago + Desglose Operativo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Caja por Medios de Pago (2 columnas en LG) */}
        <div className="lg:col-span-2 dashboard-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center border border-[var(--accent)]/20 text-[var(--accent)]">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Recaudación por Método de Pago
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ingresos generados por turnos según vía de cobro
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-400 hidden sm:inline-block">
                Total cobrado: ${totalPagosTurnos.toLocaleString("es-AR")}
              </span>
            </div>

            {/* Tarjetas de Medios de Pago */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {/* Efectivo */}
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-amber-500/15 flex items-center justify-center border border-amber-500/30 text-amber-400">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      Efectivo en Caja
                    </span>
                    <span className="text-xl font-extrabold text-white">
                      ${efectivoAmount.toLocaleString("es-AR")}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25">
                  {efectivoPercent}%
                </span>
              </div>

              {/* Mercado Pago */}
              <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-blue-500/15 flex items-center justify-center border border-blue-500/30 text-blue-400">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      Mercado Pago / Digital
                    </span>
                    <span className="text-xl font-extrabold text-blue-400">
                      ${mercadoPagoAmount.toLocaleString("es-AR")}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/25">
                  {mpPercent}%
                </span>
              </div>
            </div>

            {/* Barra visual de distribución de pagos */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                  Efectivo ({efectivoPercent}%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" />
                  Mercado Pago ({mpPercent}%)
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-900 border border-white/5 overflow-hidden flex">
                <div
                  className="bg-amber-400 h-full transition-all duration-500"
                  style={{ width: `${efectivoPercent}%` }}
                />
                <div
                  className="bg-blue-500 h-full transition-all duration-500"
                  style={{ width: `${mpPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Los cobros coinciden con los turnos registrados en este período.</span>
          </div>
        </div>

        {/* Resumen de Margen & Estructura (1 columna en LG) */}
        <div className="dashboard-card p-6 flex flex-col justify-between">
          <div>
            <div className="border-b border-white/10 pb-4 mb-5">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Percent className="w-4 h-4 text-[var(--accent)]" />
                <span>Estructura de Ingresos</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Proporción de facturación neta vs. comisiones
              </p>
            </div>

            <div className="space-y-4">
              {/* Facturación Turnos */}
              <div className="p-3.5 rounded-xl bg-slate-900/50 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Scissors className="w-4 h-4 text-violet-400" />
                  <span className="text-xs font-medium text-slate-300">Turnos & Barbería</span>
                </div>
                <span className="text-sm font-bold text-white">
                  ${totalTurnosRevenue.toLocaleString("es-AR")}
                </span>
              </div>

              {/* Facturación Ventas */}
              <div className="p-3.5 rounded-xl bg-slate-900/50 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-medium text-slate-300">Venta de Productos</span>
                </div>
                <span className="text-sm font-bold text-white">
                  ${totalSalesRevenue.toLocaleString("es-AR")}
                </span>
              </div>

              {/* Total Comisiones a Barberos */}
              <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-red-400" />
                  <span className="text-xs font-medium text-red-300">Liquidación Barberos</span>
                </div>
                <span className="text-sm font-bold text-red-400">
                  -${Math.round(totalCommissionsAll).toLocaleString("es-AR")}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Retención Negocio
            </span>
            <span className="text-2xl font-black text-[var(--accent)]">
              ${netProfit.toLocaleString("es-AR")}
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">
              Representa el {profitMargin}% del volumen total
            </span>
          </div>
        </div>
      </div>

      {/* Tabla de Liquidación Estimada por Barbero */}
      <div className="dashboard-card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center border border-violet-500/20 text-violet-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Liquidación Estimada por Barbero (Cortes)
              </h3>
              <p className="text-xs text-slate-400">
                Desglose individual según cortes realizados y tasa de comisión
              </p>
            </div>
          </div>
        </div>

        {barbers.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No hay barberos registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-3">Barbero</th>
                  <th className="py-3 px-3 text-center">Turnos Atendidos</th>
                  <th className="py-3 px-3 text-right">Facturado Cortes</th>
                  <th className="py-3 px-3 text-center">% Comisión</th>
                  <th className="py-3 px-3 text-right text-red-400">A Liquidar ($)</th>
                  <th className="py-3 px-3 text-right text-emerald-400">Margen Local ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {barbers.map((barber) => {
                  const bTotals = barberTotals.find((t) => t.barberId === barber.id);
                  const cortes = bTotals?.totalAppt ?? 0;
                  const facturado = bTotals?.totalRevenue ?? 0;
                  const commRate = barber.commission ?? 0;
                  const aLiquidar = facturado * commRate;
                  const margenLocal = facturado - aLiquidar;

                  return (
                    <tr key={barber.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-center text-[10px] font-bold text-[var(--accent)]">
                            {barber.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-white block">{barber.name}</span>
                            <span className="text-[10px] text-slate-500">{barber.role}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center font-medium text-slate-300">
                        {cortes}
                      </td>
                      <td className="py-3.5 px-3 text-right font-medium text-white">
                        ${facturado.toLocaleString("es-AR")}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-white/5 text-slate-300 font-bold text-[10px]">
                          {(commRate * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-bold text-red-400">
                        ${Math.round(aLiquidar).toLocaleString("es-AR")}
                      </td>
                      <td className="py-3.5 px-3 text-right font-bold text-emerald-400">
                        ${Math.round(margenLocal).toLocaleString("es-AR")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
