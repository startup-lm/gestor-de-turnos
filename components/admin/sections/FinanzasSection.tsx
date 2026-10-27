"use client";

import React, { useState, useMemo } from "react";
import CountUp from "react-countup";
import { Barber } from "@/lib/types/Barbers";
import { useBarberCutsData } from "@/lib/hooks/useBarberCutsdata";
import { useTotalRevenueForAllSales } from "@/lib/hooks/useTotalSalesRevenue";
import { useTotalCommissions } from "@/lib/hooks/useTotalComission";
import dynamic from "next/dynamic";

const DateRangeCalendar = dynamic(
  () => import("@/components/dashboard/DateRangeCalendar"),
  { ssr: false, loading: () => <div className="w-full h-72 rounded-2xl bg-slate-900/40 animate-pulse border border-white/5" /> }
);
import { useBusinessContext } from "@/lib/context/BusinessContext";
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
  Banknote,
  ArrowRightLeft,
  Copy,
  Check,
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
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return { start: startOfMonth, end: endOfMonth };
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
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59);
      setStartDate(monday);
      setEndDate(sunday);
      setShowCustomPicker(false);
    } else if (p === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
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
  const { businessSettings } = useBusinessContext();
  const { summary, paymentTotals, barberTotals } = useBarberCutsData(startDate, endDate, barbers);
  const { totalSalesRevenue, totalSales, totalSalesCommission, salesByBarber } = useTotalRevenueForAllSales(startDate, endDate, barbers);
  const totalCommissions = useTotalCommissions(barberTotals, barbers);

  const [copiedBarberId, setCopiedBarberId] = useState<number | null>(null);

  const handleCopyLiquidation = (
    barberName: string,
    barberId: number,
    cortes: number,
    facturadoCortes: number,
    aLiquidarCortes: number,
    facturadoVentas: number,
    aLiquidarVentas: number,
    total: number
  ) => {
    const text = `💈 *Liquidación - ${barberName}*\n📅 Período: ${formattedRange}\n\n✂️ *Cortes:* ${cortes} turnos ($${facturadoCortes.toLocaleString("es-AR")})\n💵 Comisión cortes: $${Math.round(aLiquidarCortes).toLocaleString("es-AR")}\n\n🛍️ *Ventas:* $${facturadoVentas.toLocaleString("es-AR")}\n💵 Comisión ventas: $${Math.round(aLiquidarVentas).toLocaleString("es-AR")}\n\n✅ *TOTAL A LIQUIDAR: $${Math.round(total).toLocaleString("es-AR")}*`;

    if (typeof window !== "undefined" && navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedBarberId(barberId);
      setTimeout(() => setCopiedBarberId(null), 2500);
    }
  };

  // Cálculos financieros
  const totalTurnosRevenue = summary.totalRevenue;
  const combinedRevenue = totalTurnosRevenue + totalSalesRevenue;
  const totalCommissionsAll = totalCommissions + totalSalesCommission;
  const netProfit = combinedRevenue - totalCommissionsAll;
  const isNegative = netProfit < 0;

  const profitMargin = combinedRevenue > 0 ? ((netProfit / combinedRevenue) * 100).toFixed(1) : "0";

  // Métodos de pago dinámicos
  const activeMethodNames = useMemo(() => {
    const fromSettings = businessSettings?.payment_methods || ["Efectivo", "Mercado Pago"];
    const fromTotals = Object.keys(paymentTotals || {});
    const combined = [...fromSettings];
    for (const m of fromTotals) {
      if (!combined.includes(m)) combined.push(m);
    }
    return combined;
  }, [businessSettings?.payment_methods, paymentTotals]);

  const totalPagosTurnos = useMemo(() => {
    return Object.values(paymentTotals || {}).reduce((acc, curr) => acc + curr, 0);
  }, [paymentTotals]);

  const getMethodStyle = (methodName: string) => {
    const lower = methodName.toLowerCase();
    if (lower.includes("efectivo")) {
      return {
        icon: Banknote,
        border: "border-amber-500/20",
        bg: "bg-amber-500/5",
        iconColor: "text-amber-400",
        iconBg: "bg-amber-500/15 border-amber-500/30",
        badge: "bg-amber-500/15 text-amber-300 border-amber-500/25",
        barColor: "bg-amber-400",
        textColor: "text-white",
      };
    }
    if (lower.includes("mercado") || lower.includes("mp")) {
      return {
        icon: Wallet,
        border: "border-sky-500/20",
        bg: "bg-sky-500/5",
        iconColor: "text-sky-400",
        iconBg: "bg-sky-500/15 border-sky-500/30",
        badge: "bg-sky-500/15 text-sky-300 border-sky-500/25",
        barColor: "bg-sky-400",
        textColor: "text-sky-400",
      };
    }
    if (lower.includes("transf")) {
      return {
        icon: ArrowRightLeft,
        border: "border-purple-500/20",
        bg: "bg-purple-500/5",
        iconColor: "text-purple-400",
        iconBg: "bg-purple-500/15 border-purple-500/30",
        badge: "bg-purple-500/15 text-purple-300 border-purple-500/25",
        barColor: "bg-purple-400",
        textColor: "text-purple-400",
      };
    }
    if (lower.includes("débito") || lower.includes("debito")) {
      return {
        icon: CreditCard,
        border: "border-emerald-500/20",
        bg: "bg-emerald-500/5",
        iconColor: "text-emerald-400",
        iconBg: "bg-emerald-500/15 border-emerald-500/30",
        badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
        barColor: "bg-emerald-400",
        textColor: "text-emerald-400",
      };
    }
    if (lower.includes("crédito") || lower.includes("credito")) {
      return {
        icon: Coins,
        border: "border-pink-500/20",
        bg: "bg-pink-500/5",
        iconColor: "text-pink-400",
        iconBg: "bg-pink-500/15 border-pink-500/30",
        badge: "bg-pink-500/15 text-pink-300 border-pink-500/25",
        barColor: "bg-pink-400",
        textColor: "text-pink-400",
      };
    }
    return {
      icon: CreditCard,
      border: "border-slate-800",
      bg: "bg-slate-800/30",
      iconColor: "text-slate-300",
      iconBg: "bg-slate-800 border-slate-700",
      badge: "bg-slate-800 text-slate-300 border-slate-700",
      barColor: "bg-slate-500",
      textColor: "text-slate-200",
    };
  };

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
              Esta semana
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
              Este mes
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
              Mes pasado
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

      {/* Rango Activo Informativo */}
      <div className="flex items-center text-xs text-slate-400 gap-2 bg-slate-900/40 px-3.5 py-2.5 rounded-xl border border-white/5">
        <Calendar className="w-4 h-4 text-[var(--accent)]" />
        <span>Período consultado:</span>
        <span className="font-semibold text-white">{formattedRange}</span>
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
              <span className="block text-[11px] font-bold text-slate-400 tracking-wider leading-none mb-1.5">
                Ganancia neta
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
              className={`font-bold text-[10px] px-2 py-0.5 rounded-md border ${
                isNegative
                  ? "bg-red-500/10 border-red-500/30 text-red-400"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              }`}
            >
              {isNegative ? "Saldo deudor" : "Superávit"}
            </span>
            <span className="text-slate-400 text-[11px] font-medium">Margen: {profitMargin}%</span>
          </div>
        </div>

        {/* KPI 2: Ingresos Brutos */}
        <div className="kpi-card kpi-card--revenue flex flex-col justify-between gap-4 p-5 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="block text-[11px] font-bold text-slate-400 tracking-wider leading-none mb-1.5">
                Ingresos brutos
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
              <span className="block text-[11px] font-bold text-slate-400 tracking-wider leading-none mb-1.5">
                Comisiones a pagar
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
            <span>Por turnos: ${Math.round(totalCommissions).toLocaleString("es-AR")}</span>
            <span>Por ventas: ${Math.round(totalSalesCommission).toLocaleString("es-AR")}</span>
          </div>
        </div>

        {/* KPI 4: Volumen Operativo */}
        <div className="kpi-card kpi-card--sales flex flex-col justify-between gap-4 p-5 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="block text-[11px] font-bold text-slate-400 tracking-wider leading-none mb-1.5">
                Operaciones totales
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
                    Recaudación por método de pago
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

            {/* Tarjetas de Medios de Pago Dinámicas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {activeMethodNames.map((method) => {
                const amount = paymentTotals?.[method] ?? 0;
                const percent = totalPagosTurnos > 0 ? Math.round((amount / totalPagosTurnos) * 100) : 0;
                const style = getMethodStyle(method);
                const IconComponent = style.icon;

                return (
                  <div
                    key={method}
                    className={`p-4 rounded-2xl ${style.bg} border ${style.border} flex items-center justify-between transition-all`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`w-11 h-11 rounded-xl ${style.iconBg} flex items-center justify-center border flex-shrink-0`}>
                        <IconComponent className={`w-5 h-5 ${style.iconColor}`} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider block mb-0.5 truncate">
                          {method}
                        </span>
                        <span className={`text-xl font-extrabold ${style.textColor} block truncate`}>
                          ${amount.toLocaleString("es-AR")}
                        </span>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border flex-shrink-0 ml-2 ${style.badge}`}>
                      {percent}%
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Barra visual de distribución de pagos */}
            <div className="space-y-2">
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-400">
                {activeMethodNames.map((method) => {
                  const amount = paymentTotals?.[method] ?? 0;
                  const percent = totalPagosTurnos > 0 ? Math.round((amount / totalPagosTurnos) * 100) : 0;
                  const style = getMethodStyle(method);
                  return (
                    <span key={method} className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${style.barColor} inline-block`} />
                      {method} ({percent}%)
                    </span>
                  );
                })}
              </div>
              <div className="w-full h-3 rounded-full bg-slate-900 border border-white/5 overflow-hidden flex">
                {activeMethodNames.map((method) => {
                  const amount = paymentTotals?.[method] ?? 0;
                  const percent = totalPagosTurnos > 0 ? Math.round((amount / totalPagosTurnos) * 100) : 0;
                  const style = getMethodStyle(method);
                  if (percent <= 0) return null;
                  return (
                    <div
                      key={method}
                      className={`${style.barColor} h-full transition-all duration-500`}
                      style={{ width: `${percent}%` }}
                      title={`${method}: ${percent}%`}
                    />
                  );
                })}
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
                <span>Estructura de ingresos</span>
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
                  <span className="text-xs font-medium text-slate-300">Turnos y barbería</span>
                </div>
                <span className="text-sm font-bold text-white">
                  ${totalTurnosRevenue.toLocaleString("es-AR")}
                </span>
              </div>

              {/* Facturación Ventas */}
              <div className="p-3.5 rounded-xl bg-slate-900/50 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-medium text-slate-300">Venta de productos</span>
                </div>
                <span className="text-sm font-bold text-white">
                  ${totalSalesRevenue.toLocaleString("es-AR")}
                </span>
              </div>

              {/* Total Comisiones a Barberos */}
              <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-red-400" />
                  <span className="text-xs font-medium text-red-300">Liquidación de barberos</span>
                </div>
                <span className="text-sm font-bold text-red-400">
                  -${Math.round(totalCommissionsAll).toLocaleString("es-AR")}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-center">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider block mb-1">
              Retención del negocio
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

      {/* Tabla de Liquidación Completa por Barbero (Cortes + Ventas) */}
      <div className="dashboard-card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center border border-violet-500/20 text-violet-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Liquidación estimada por profesional
              </h3>
              <p className="text-xs text-slate-400">
                Desglose individual completo según servicios, productos vendidos y porcentajes de comisión
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
                <tr className="border-b border-white/10 text-[10px] tracking-wider text-slate-400">
                  <th className="py-3 px-3">Profesional</th>
                  <th className="py-3 px-3 text-center">Turnos</th>
                  <th className="py-3 px-3 text-right">Facturado Cortes</th>
                  <th className="py-3 px-3 text-right">Comis. Cortes ($)</th>
                  <th className="py-3 px-3 text-right">Facturado Ventas</th>
                  <th className="py-3 px-3 text-right">Comis. Ventas ($)</th>
                  <th className="py-3 px-3 text-right text-red-400 font-bold">Total a Liquidar ($)</th>
                  <th className="py-3 px-3 text-right text-emerald-400 font-bold">Margen Local ($)</th>
                  <th className="py-3 px-3 text-center">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {barbers.map((barber) => {
                  const bTotals = barberTotals.find((t) => t.barberId === barber.id);
                  const cortes = bTotals?.totalAppt ?? 0;
                  const facturadoCortes = bTotals?.totalRevenue ?? 0;
                  const commRateCortes = barber.commission ?? 0;
                  const aLiquidarCortes = facturadoCortes * commRateCortes;

                  const bSales = salesByBarber?.find((s) => s.barberId === barber.id);
                  const facturadoVentas = bSales?.totalSalesRevenue ?? 0;
                  const commRateVentas = barber.sale_commission ?? 0;
                  const aLiquidarVentas = facturadoVentas * commRateVentas;

                  const totalALiquidar = aLiquidarCortes + aLiquidarVentas;
                  const totalFacturado = facturadoCortes + facturadoVentas;
                  const margenLocal = totalFacturado - totalALiquidar;

                  const isCopied = copiedBarberId === barber.id;

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
                        ${facturadoCortes.toLocaleString("es-AR")}
                      </td>
                      <td className="py-3.5 px-3 text-right text-slate-300">
                        <span className="text-[10px] text-slate-500 mr-1">({(commRateCortes * 100).toFixed(0)}%)</span>
                        ${Math.round(aLiquidarCortes).toLocaleString("es-AR")}
                      </td>
                      <td className="py-3.5 px-3 text-right font-medium text-white">
                        ${facturadoVentas.toLocaleString("es-AR")}
                      </td>
                      <td className="py-3.5 px-3 text-right text-slate-300">
                        <span className="text-[10px] text-slate-500 mr-1">({(commRateVentas * 100).toFixed(0)}%)</span>
                        ${Math.round(aLiquidarVentas).toLocaleString("es-AR")}
                      </td>
                      <td className="py-3.5 px-3 text-right font-extrabold text-red-400 text-sm">
                        ${Math.round(totalALiquidar).toLocaleString("es-AR")}
                      </td>
                      <td className="py-3.5 px-3 text-right font-extrabold text-emerald-400 text-sm">
                        ${Math.round(margenLocal).toLocaleString("es-AR")}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyLiquidation(
                              barber.name,
                              barber.id ?? 0,
                              cortes,
                              facturadoCortes,
                              aLiquidarCortes,
                              facturadoVentas,
                              aLiquidarVentas,
                              totalALiquidar
                            )
                          }
                          title="Copiar detalle para WhatsApp"
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border ${
                            isCopied
                              ? "!bg-emerald-500/20 !border-emerald-500/40 !text-emerald-400"
                              : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
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
