import { useAuth } from "@/lib/auth/AuthContext";
import React from "react";
import CountUp from "react-countup";
import { Scissors, ShoppingBag, Coins, Percent, TrendingUp } from "lucide-react";

interface Props {
  turnos: number;
  ventas: number;
  ingresos: number;
  comision: number;
  comisionVenta: number;
  ingresosVentas: number;
}


export default function Metrics({
  turnos,
  ventas,
  ingresos,
  comision,
  comisionVenta,
  ingresosVentas,
}: Readonly<Props>) {
  const { role } = useAuth();
  const gananciaCortes = ingresos * comision;
  const gananciaVentas = ingresosVentas * comisionVenta;
  const gananciaTotal = gananciaCortes + gananciaVentas;

  if (role !== "admin") {
    return (
      <div className="kpi-card kpi-card--net w-full max-w-sm flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/25 text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">
              Mis Ganancias
            </span>
            <span className="text-xl font-extrabold text-emerald-400">
              <CountUp
                start={0}
                end={gananciaTotal}
                duration={2}
                separator="."
                prefix="$"
              />
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full text-sm">
      {/* 💈 CARD 1: CORTES & SERVICIOS */}
      <div className="kpi-card kpi-card--cuts flex flex-col justify-between gap-4 p-5">
        <div className="flex items-start justify-between">
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1.5">
              Cortes & Servicios
            </span>
            <h4 className="text-2xl font-extrabold text-white leading-tight">
              <CountUp start={0} end={turnos} duration={2} separator="." />
              <span className="text-xs text-slate-500 font-medium ml-1.5">turnos</span>
            </h4>
          </div>
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20 text-violet-400 shadow-inner">
            <Scissors className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800/60 flex justify-between items-center text-xs">
          <span className="text-slate-400 font-medium">Facturado:</span>
          <span className="font-bold text-green-500 text-sm">
            <CountUp start={0} end={ingresos} duration={2} prefix="$" separator="." />
          </span>
        </div>
      </div>

      {/* 🛍️ CARD 2: VENTAS & PRODUCTOS */}
      <div className="kpi-card kpi-card--sales flex flex-col justify-between gap-4 p-5">
        <div className="flex items-start justify-between">
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1.5">
              Venta Productos
            </span>
            <h4 className="text-2xl font-extrabold text-white leading-tight">
              <CountUp start={0} end={ventas} duration={2} separator="." />
              <span className="text-xs text-slate-500 font-medium ml-1.5">unids.</span>
            </h4>
          </div>
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 flex items-center justify-center border border-sky-500/20 text-sky-400 shadow-inner">
            <ShoppingBag className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800/60 flex justify-between items-center text-xs">
          <span className="text-slate-400 font-medium">Facturado:</span>
          <span className="font-bold text-green-500 text-sm">
            <CountUp start={0} end={ingresosVentas} duration={2} prefix="$" separator="." />
          </span>
        </div>
      </div>

      {/* 🪙 CARD 3: COMISIONES */}
      <div className="kpi-card kpi-card--revenue flex flex-col gap-3.5 p-5 sm:col-span-2 lg:col-span-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Comisiones Barbero
          </span>
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-400 shadow-inner">
            <Coins className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 flex items-center gap-1">
              <Percent className="w-3 h-3 text-[var(--accent)]" />
              Por Cortes ({comision * 100}%):
            </span>
            <span className="font-bold text-green-500 text-sm">
              <CountUp start={0} end={gananciaCortes} duration={2} prefix="$" separator="." />
            </span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-800/60">
            <span className="text-slate-400 flex items-center gap-1">
              <Percent className="w-3 h-3 text-[var(--accent)]" />
              Por Ventas ({comisionVenta * 100}%):
            </span>
            <span className="font-bold text-green-500 text-sm">
              <CountUp start={0} end={gananciaVentas} duration={2} prefix="$" separator="." />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}