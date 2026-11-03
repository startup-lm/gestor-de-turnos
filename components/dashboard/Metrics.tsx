"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import React from "react";
import Link from "next/link";
import CountUp from "react-countup";
import { AlertTriangle, ArrowRight, Scissors, ShoppingBag, TrendingUp } from "lucide-react";
import { formatARS } from "@/lib/format/currency";

interface Props {
  /** Turnos cobrados: los que suman a la facturación */
  turnos: number;
  /** Todos los turnos agendados del período, cobrados o no */
  turnosAgendados: number;
  ventas: number;
  ingresos: number;
  /** Comisiones del barbero elegido, calculadas en el servidor con el % congelado */
  gananciaCortes: number;
  gananciaVentas: number;
  ingresosVentas: number;
  /** Turnos finalizados sin cobrar en el período */
  turnosSinCobrar: number;
  /** Monto total adeudado de turnos sin cobrar */
  montoSinCobrar: number;
  /** Enlace a los turnos pendientes del período */
  pendientesHref: string;
}

export default function Metrics({
  turnos,
  turnosAgendados,
  ventas,
  ingresos,
  gananciaCortes,
  gananciaVentas,
  ingresosVentas,
  turnosSinCobrar,
  montoSinCobrar,
  pendientesHref,
}: Readonly<Props>) {
  const { role } = useAuth();
  const isAdmin = role === "admin";

  const gananciaTotal = gananciaCortes + gananciaVentas;

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
                <span className="text-xs text-slate-500 font-medium ml-1.5">cobrados</span>
              </h4>
              <span className="block text-[11px] text-slate-500 mt-0.5">{turnosAgendados} agendados</span>
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

  // Vista para administrador: actividad del local (los montos totales viven en Balance)
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
      {/* Cortes y servicios */}
      <div className="kpi-card kpi-card--cuts flex flex-col justify-between gap-3.5 p-5 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span className="block text-[11px] font-bold text-slate-400 tracking-wider leading-none mb-1.5 truncate">
              Cortes y servicios
            </span>
            <h4 className="text-2xl lg:text-3xl font-black text-white leading-tight">
              <CountUp start={0} end={turnos} duration={2} separator="." />
              <span className="text-xs text-slate-500 font-semibold ml-1.5">cobrados</span>
            </h4>
            <span className="block text-[11px] text-slate-500 mt-0.5">{turnosAgendados} agendados</span>
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

      {/* Venta de productos */}
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

      {/* Turnos sin cobrar */}
      <div className="kpi-card kpi-card--revenue flex flex-col justify-between gap-3.5 p-5 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span className="block text-[11px] font-bold text-slate-400 tracking-wider leading-none mb-1.5 truncate">
              Turnos sin cobrar
            </span>
            <h4
              className={`text-2xl lg:text-3xl font-black leading-tight ${
                turnosSinCobrar > 0 ? "text-amber-400" : "text-white"
              }`}
            >
              <CountUp start={0} end={turnosSinCobrar} duration={2} separator="." />
            </h4>
            <span className="block text-[11px] text-slate-500 mt-0.5 truncate">
              {turnosSinCobrar > 0 ? `Suman ${formatARS(montoSinCobrar)}` : "Está todo cobrado"}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/25 text-amber-400 shadow-inner flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="pt-2.5 border-t border-white/5 flex items-center">
          {turnosSinCobrar > 0 ? (
            <Link
              href={pendientesHref}
              className="inline-flex items-center gap-1.5 min-h-[44px] text-xs font-semibold text-amber-300 hover:text-amber-200 transition-colors"
            >
              <span>Ver turnos</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <span className="text-[11px] text-slate-400">Nada pendiente en el período</span>
          )}
        </div>
      </div>
    </div>
  );
}
