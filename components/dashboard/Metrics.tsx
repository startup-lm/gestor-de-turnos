"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import React from "react";
import CountUp from "react-countup";
import { Scissors, ShoppingBag, TrendingUp, DollarSign, Wallet, Award } from "lucide-react";
import { formatARS } from "@/lib/format/currency";

interface Props {
  turnos: number;
  ventas: number;
  ingresos: number;
  comision: number;
  comisionVenta: number;
  ingresosVentas: number;
  selectedBarberId?: number;
  totalCommissionsAll?: number;
}

export default function Metrics({
  turnos,
  ventas,
  ingresos,
  comision,
  comisionVenta,
  ingresosVentas,
  selectedBarberId = 0,
  totalCommissionsAll = 0,
}: Readonly<Props>) {
  const { role } = useAuth();
  const isAdmin = role === "admin";

  const facturacionTotal = ingresos + ingresosVentas;
  const ticketPromedio = turnos > 0 ? Math.round(ingresos / turnos) : 0;

  const isGlobalView = selectedBarberId === 0;

  // Ganancias individuales
  const gananciaCortes = ingresos * comision;
  const gananciaVentas = ingresosVentas * comisionVenta;
  const gananciaTotal = gananciaCortes + gananciaVentas;

  // En vista global, comisiones totales a pagar
  const comisionesFinales = isGlobalView ? totalCommissionsAll : gananciaTotal;
  const margenRetencion = facturacionTotal > 0
    ? Math.max(0, Math.round(((facturacionTotal - comisionesFinales) / facturacionTotal) * 100))
    : 0;

  // Vista para barbero no administrador
  if (!isAdmin) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
        {/* Card 1: Mis Ganancias */}
        <div className="kpi-card kpi-card--net p-5 flex flex-col justify-between gap-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="block text-[10px] font-bold text-slate-400 tracking-wider mb-1">
                Mis ganancias totales
              </span>
              <h4 className="text-2xl font-extrabold text-emerald-400">
                <CountUp start={0} end={gananciaTotal} duration={2} separator="." prefix="$" />
              </h4>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/25 text-emerald-400 shadow-inner">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
            <span>Por cortes: {formatARS(gananciaCortes)}</span>
            <span>Por ventas: {formatARS(gananciaVentas)}</span>
          </div>
        </div>

        {/* Card 2: Turnos Atendidos */}
        <div className="kpi-card kpi-card--cuts p-5 flex flex-col justify-between gap-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="block text-[10px] font-bold text-slate-400 tracking-wider mb-1">
                Turnos realizados
              </span>
              <h4 className="text-2xl font-extrabold text-white">
                <CountUp start={0} end={turnos} duration={2} separator="." />
                <span className="text-xs text-slate-500 font-medium ml-1.5">turnos</span>
              </h4>
            </div>
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/25 text-violet-400 shadow-inner">
              <Scissors className="w-5 h-5" />
            </div>
          </div>
          <div className="pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
            <span>Facturado:</span>
            <span className="font-bold text-white">{formatARS(ingresos)}</span>
          </div>
        </div>

        {/* Card 3: Productos Vendidos */}
        <div className="kpi-card kpi-card--sales p-5 flex flex-col justify-between gap-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="block text-[10px] font-bold text-slate-400 tracking-wider mb-1">
                Productos vendidos
              </span>
              <h4 className="text-2xl font-extrabold text-white">
                <CountUp start={0} end={ventas} duration={2} separator="." />
                <span className="text-xs text-slate-500 font-medium ml-1.5">unids.</span>
              </h4>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center border border-sky-500/25 text-sky-400 shadow-inner">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
            <span>Facturado:</span>
            <span className="font-bold text-white">{formatARS(ingresosVentas)}</span>
          </div>
        </div>
      </div>
    );
  }

  // Vista para Administrador: 4 KPIs Ejecutivos
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
      {/* 🌟 KPI 1: FACTURACIÓN TOTAL */}
      <div className="kpi-card kpi-card--revenue flex flex-col justify-between gap-3.5 p-5 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span className="block text-[11px] font-bold text-slate-400 tracking-wider leading-none mb-1.5 truncate">
              Facturación total
            </span>
            <h4 className="text-2xl lg:text-3xl font-black text-white leading-tight truncate">
              <CountUp start={0} end={facturacionTotal} duration={2} prefix="$" separator="." />
            </h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/25 text-amber-400 shadow-inner flex-shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
          <span className="truncate">Cortes: {formatARS(ingresos)}</span>
          <span className="truncate">Ventas: {formatARS(ingresosVentas)}</span>
        </div>
      </div>

      {/* 💈 KPI 2: CORTES Y SERVICIOS */}
      <div className="kpi-card kpi-card--cuts flex flex-col justify-between gap-3.5 p-5 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span className="block text-[11px] font-bold text-slate-400 tracking-wider leading-none mb-1.5 truncate">
              Cortes y servicios
            </span>
            <h4 className="text-2xl lg:text-3xl font-black text-white leading-tight">
              <CountUp start={0} end={turnos} duration={2} separator="." />
              <span className="text-xs text-slate-500 font-semibold ml-1.5">turnos</span>
            </h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/25 text-violet-400 shadow-inner flex-shrink-0">
            <Scissors className="w-5 h-5" />
          </div>
        </div>

        <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Facturado:</span>
          <span className="font-bold text-emerald-400 text-xs">
            <CountUp start={0} end={ingresos} duration={2} prefix="$" separator="." />
          </span>
        </div>
      </div>

      {/* 🛍️ KPI 3: VENTAS Y PRODUCTOS */}
      <div className="kpi-card kpi-card--sales flex flex-col justify-between gap-3.5 p-5 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span className="block text-[11px] font-bold text-slate-400 tracking-wider leading-none mb-1.5 truncate">
              Venta de productos
            </span>
            <h4 className="text-2xl lg:text-3xl font-black text-white leading-tight">
              <CountUp start={0} end={ventas} duration={2} separator="." />
              <span className="text-xs text-slate-500 font-semibold ml-1.5">unids.</span>
            </h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center border border-sky-500/25 text-sky-400 shadow-inner flex-shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Facturado:</span>
          <span className="font-bold text-emerald-400 text-xs">
            <CountUp start={0} end={ingresosVentas} duration={2} prefix="$" separator="." />
          </span>
        </div>
      </div>

      {/* 🪙 KPI 4: LIQUIDACIÓN / RENDIMIENTO */}
      <div className="kpi-card kpi-card--net flex flex-col justify-between gap-3.5 p-5 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span className="block text-[11px] font-bold text-slate-400 tracking-wider leading-none mb-1.5 truncate">
              {isGlobalView ? "Comisiones a liquidar" : "Ganancia del profesional"}
            </span>
            <h4 className="text-2xl lg:text-3xl font-black text-emerald-400 leading-tight truncate">
              <CountUp start={0} end={comisionesFinales} duration={2} prefix="$" separator="." />
            </h4>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/25 text-emerald-400 shadow-inner flex-shrink-0">
            {isGlobalView ? <Wallet className="w-5 h-5" /> : <Award className="w-5 h-5" />}
          </div>
        </div>

        <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px]">
          <span className="text-slate-400 truncate">
            {isGlobalView ? `Margen local: ${margenRetencion}%` : `Ticket prom: ${formatARS(ticketPromedio)}`}
          </span>
          <span className="font-semibold text-slate-300 text-xs">
            {isGlobalView ? `Ticket: ${formatARS(ticketPromedio)}` : `Comisión: ${(comision * 100).toFixed(0)}%`}
          </span>
        </div>
      </div>
    </div>
  );
}