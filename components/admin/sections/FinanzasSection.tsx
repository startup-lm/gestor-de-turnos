"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import CountUp from "react-countup";
import { Barber } from "@/lib/types/Barbers";
import { useBarberCutsData } from "@/lib/hooks/useBarberCutsdata";
import { useTotalRevenueForAllSales } from "@/lib/hooks/useTotalSalesRevenue";
import { useTotalCommissions } from "@/lib/hooks/useTotalComission";
import { useBusinessContext } from "@/lib/context/BusinessContext";
import { getCashSummary, CashSummaryResponse } from "@/lib/repository/cash";
import { formatLocalDate } from "@/lib/dates/argentina";
import {
  DatePreset,
  getPresetRange,
  presetFromClosingFrequency,
} from "@/lib/dates/presets";
import DatePresetSelector from "@/components/admin/DatePresetSelector";
import { formatARS } from "@/lib/format/currency";
import { roleLabel } from "@/lib/format/roles";
import {
  Wallet,
  Coins,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Users,
  Banknote,
  ArrowRightLeft,
} from "lucide-react";

interface Props {
  barbers: Barber[];
}

export default function FinanzasSection({ barbers }: Readonly<Props>) {
  const { businessSettings, isEnabled } = useBusinessContext();
  const isExpensesEnabled = isEnabled("expenses");

  const initialPreset = useMemo(
    () => presetFromClosingFrequency(businessSettings?.cash_closing_frequency),
    [businessSettings?.cash_closing_frequency]
  );
  const initialRange = useMemo(() => getPresetRange(initialPreset), [initialPreset]);

  const [preset, setPreset] = useState<DatePreset>(initialPreset);
  const [startDate, setStartDate] = useState<Date>(initialRange.start);
  const [endDate, setEndDate] = useState<Date>(initialRange.end);

  const freqRef = useRef(businessSettings?.cash_closing_frequency);
  useEffect(() => {
    if (
      businessSettings?.cash_closing_frequency &&
      businessSettings.cash_closing_frequency !== freqRef.current
    ) {
      freqRef.current = businessSettings.cash_closing_frequency;
      const p = presetFromClosingFrequency(businessSettings.cash_closing_frequency);
      const r = getPresetRange(p);
      setPreset(p);
      setStartDate(r.start);
      setEndDate(r.end);
    }
  }, [businessSettings?.cash_closing_frequency]);

  const [cashSummary, setCashSummary] = useState<CashSummaryResponse | null>(null);
  const [cashSummaryLoading, setCashSummaryLoading] = useState(true);
  const [cashSummaryError, setCashSummaryError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setCashSummaryLoading(true);
    setCashSummaryError(null);
    (async () => {
      const res = await getCashSummary({
        startDate: formatLocalDate(startDate),
        endDate: formatLocalDate(endDate),
      });
      if (!isMounted) return;
      if (res.success && res.data) {
        setCashSummary(res.data);
      } else {
        setCashSummary(null);
        setCashSummaryError(res.error || "No se pudieron cargar los datos. Probá de nuevo.");
      }
      setCashSummaryLoading(false);
    })();
    return () => {
      isMounted = false;
    };
  }, [startDate, endDate]);

  const operatingExpenses = cashSummary?.expensesTotal ?? 0;
  const ownerWithdrawals = cashSummary?.withdrawalsTotal ?? 0;

  const { summary, barberTotals } = useBarberCutsData(startDate, endDate, barbers);
  const { totalSalesRevenue, totalSalesCommission, salesByBarber } =
    useTotalRevenueForAllSales(startDate, endDate);
  const totalCommissions = useTotalCommissions(barberTotals);

  // Cálculos financieros
  const totalTurnosRevenue = summary.totalRevenue;
  const combinedRevenue = totalTurnosRevenue + totalSalesRevenue;
  const totalCommissionsAll = totalCommissions + totalSalesCommission;

  // Ganancia neta
  const netProfit = isExpensesEnabled
    ? combinedRevenue - totalCommissionsAll - operatingExpenses
    : combinedRevenue - totalCommissionsAll;
  const isNegative = netProfit < 0;

  const profitMargin =
    combinedRevenue > 0 ? ((netProfit / combinedRevenue) * 100).toFixed(1) : "0";

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

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
      {/* Cabecera Principal */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
            Balance
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Estado de resultados, comisiones generadas, ganancia neta y medios de pago
          </p>
        </div>
      </div>

      {/* Selector de Período */}
      <DatePresetSelector
        preset={preset}
        startDate={startDate}
        endDate={endDate}
        onChange={({ preset: nextPreset, startDate: nextStart, endDate: nextEnd }) => {
          setPreset(nextPreset);
          setStartDate(nextStart);
          setEndDate(nextEnd);
        }}
      />

      {/* 4 KPIs Financieros Clave */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <CountUp start={0} end={Math.round(netProfit)} duration={2} prefix="$" separator="." />
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
            {Math.round(netProfit) !== 0 && (
              <span
                className={`font-bold text-[10px] px-2 py-0.5 rounded-md border ${
                  Math.round(netProfit) < 0
                    ? "bg-red-500/10 border-red-500/30 text-red-400"
                    : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                }`}
              >
                {Math.round(netProfit) < 0 ? "Déficit" : "Superávit"}
              </span>
            )}
            <span className="text-slate-400 text-[11px] font-medium">
              Margen: {profitMargin}%{Math.round(operatingExpenses) > 0 ? ` · Gastos: -${formatARS(operatingExpenses)}` : ""}
              {Math.round(ownerWithdrawals) > 0 ? ` · Retiraste: ${formatARS(ownerWithdrawals)}` : ""}
            </span>
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
                <CountUp start={0} end={Math.round(combinedRevenue)} duration={2} prefix="$" separator="." />
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-400 shadow-inner flex-shrink-0">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>

          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span>Cortes: {formatARS(totalTurnosRevenue)}</span>
            <span>Ventas: {formatARS(totalSalesRevenue)}</span>
          </div>
        </div>

        {/* KPI 3: Comisiones Generadas */}
        <div className="kpi-card kpi-card--negative flex flex-col justify-between gap-4 p-5 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="block text-[11px] font-bold text-slate-400 tracking-wider leading-none mb-1.5">
                Comisiones generadas
              </span>
              <h3 className="text-2xl lg:text-3xl font-extrabold text-red-400">
                <CountUp start={0} end={Math.round(totalCommissionsAll)} duration={2} prefix="$" separator="." />
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-400 shadow-inner flex-shrink-0">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>

          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span>Por turnos: {formatARS(totalCommissions)}</span>
            <span>Por ventas: {formatARS(totalSalesCommission)}</span>
          </div>
        </div>
      </div>

      {/* Caja por medio de pago (en el bloque de caja pasa a ser "Cobros y caja") */}
      <div>
        <div className="dashboard-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center border border-[var(--accent)]/20 text-[var(--accent)]">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Caja por medio de pago
                  </h3>
                  <p className="text-xs text-slate-400">
                    Lo que debería haber en cada medio al cerrar la caja: cobros de turnos y ventas menos gastos, adelantos y liquidaciones
                  </p>
                </div>
              </div>
              {cashSummary && !cashSummaryError && (
                <span className="text-xs font-semibold text-slate-300 hidden sm:inline-block">
                  Total neto: {formatARS(cashSummary.totals.net)}
                </span>
              )}
            </div>

            {cashSummaryError ? (
              <div className="p-6 rounded-xl bg-red-950/20 border border-red-500/20 text-center text-xs text-red-300">
                No se pudieron cargar los datos. Probá de nuevo.
              </div>
            ) : cashSummaryLoading ? (
              <div className="p-8 text-center text-xs text-slate-400 animate-pulse">
                Cargando caja por medio de pago...
              </div>
            ) : cashSummary ? (
              <>
                {/* Sub-tarjetas de Medios de Pago */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {cashSummary.rows.map((row) => {
                    const style = getMethodStyle(row.method);
                    const IconComponent = style.icon;

                    return (
                      <div
                        key={row.method}
                        className={`p-4 rounded-2xl ${style.bg} border ${style.border} flex items-center justify-between transition-all`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div
                            className={`w-11 h-11 rounded-xl ${style.iconBg} flex items-center justify-center border flex-shrink-0`}
                          >
                            <IconComponent className={`w-5 h-5 ${style.iconColor}`} />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-slate-400 tracking-wider block mb-0.5 truncate">
                              {row.method}
                            </span>
                            <span
                              className={`text-xl font-extrabold ${style.textColor} block truncate`}
                            >
                              {formatARS(row.net)}
                            </span>
                            <span className="text-[11px] text-slate-400 block truncate">
                              Ingresos {formatARS(row.income)} · Egresos {formatARS(row.outcome)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Barra visual de distribución de pagos calculada sobre income */}
                {cashSummary.totals.income > 0 && (
                  <div className="space-y-2">
                    <div className="w-full h-3 rounded-full bg-slate-900 border border-white/5 overflow-hidden flex">
                      {cashSummary.rows.map((row) => {
                        const percent = (row.income / cashSummary.totals.income) * 100;
                        if (percent <= 0) return null;
                        const style = getMethodStyle(row.method);
                        return (
                          <div
                            key={row.method}
                            className={`${style.barColor} h-full transition-all duration-500`}
                            style={{ width: `${percent}%` }}
                            title={`${row.method}: ${Math.round(percent)}%`}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Tabla de Comisiones por Profesional */}
      <div className="dashboard-card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center border border-violet-500/20 text-violet-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Comisiones por profesional
              </h3>
              <p className="text-xs text-slate-400">
                Desglose individual según servicios, productos y porcentajes de comisión acordados
              </p>
            </div>
          </div>
        </div>

        {barbers.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No hay profesionales registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-[10px] tracking-wider text-slate-400">
                  <th className="py-3 px-3">Profesional</th>
                  <th className="py-3 px-3 text-center">Turnos cobrados</th>
                  <th className="py-3 px-3 text-right">Facturado cortes</th>
                  <th className="py-3 px-3 text-right">Comisión cortes</th>
                  <th className="py-3 px-3 text-right">Facturado ventas</th>
                  <th className="py-3 px-3 text-right">Comisión ventas</th>
                  <th className="py-3 px-3 text-right text-red-400 font-bold">Total comisión</th>
                  <th className="py-3 px-3 text-right text-emerald-400 font-bold">Margen del local</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {barbers.map((barber) => {
                  const bTotals = barberTotals.find((t) => t.barberId === barber.id);
                  const cortes = bTotals?.totalAppt ?? 0;
                  const facturadoCortes = bTotals?.totalRevenue ?? 0;
                  // El % que se muestra es el vigente; el monto sale del servidor con el % congelado al cobrar
                  const commRateCortes = barber.commission ?? 0;
                  const aLiquidarCortes = bTotals?.totalCommission ?? 0;

                  const bSales = salesByBarber?.find((s) => s.barberId === barber.id);
                  const facturadoVentas = bSales?.totalSalesRevenue ?? 0;
                  const commRateVentas = barber.sale_commission ?? 0;
                  const aLiquidarVentas = bSales?.totalSalesCommission ?? 0;

                  const totalALiquidar = aLiquidarCortes + aLiquidarVentas;
                  const totalFacturado = facturadoCortes + facturadoVentas;
                  const margenLocal = totalFacturado - totalALiquidar;

                  return (
                    <tr key={barber.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-center text-[10px] font-bold text-[var(--accent)]">
                            {barber.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-white block">{barber.name}</span>
                            <span className="text-[10px] text-slate-500">{roleLabel(barber.role)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center font-medium text-slate-300">
                        {cortes}
                      </td>
                      <td className="py-3.5 px-3 text-right font-medium text-white">
                        {formatARS(facturadoCortes)}
                      </td>
                      <td className="py-3.5 px-3 text-right text-slate-300">
                        <span className="text-[10px] text-slate-500 mr-1">
                          ({Math.round(commRateCortes * 100)}%)
                        </span>
                        {formatARS(aLiquidarCortes)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-medium text-white">
                        {formatARS(facturadoVentas)}
                      </td>
                      <td className="py-3.5 px-3 text-right text-slate-300">
                        <span className="text-[10px] text-slate-500 mr-1">
                          ({Math.round(commRateVentas * 100)}%)
                        </span>
                        {formatARS(aLiquidarVentas)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-extrabold text-red-400 text-sm">
                        {formatARS(totalALiquidar)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-extrabold text-emerald-400 text-sm">
                        {formatARS(margenLocal)}
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
