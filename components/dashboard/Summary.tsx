"use client";

import CountUp from "react-countup";
import { BarberTotalData, PaymentMethodTotals } from "@/lib/hooks/useBarberCutsdata";
import { TotalSalesData } from "@/lib/hooks/useTotalSalesRevenue";
import { 
  TrendingUp, 
  Scissors, 
  ShoppingBag, 
  Coins, 
  Wallet, 
  CreditCard,
  ArrowUpRight, 
  ArrowDownRight, 
  AlertTriangle 
} from "lucide-react";

interface SummaryProps {
  data: BarberTotalData;
  salesData: TotalSalesData;
  totalCommissions: number;
  paymentTotals?: PaymentMethodTotals;
}

export default function Summary({ data, salesData, totalCommissions, paymentTotals }: Readonly<SummaryProps>) {
  const { totalAppt, totalRevenue } = data;
  const { totalSalesRevenue, totalSales, totalSalesCommission } = salesData;
  const combinedRevenue = totalRevenue + totalSalesRevenue;
  const totalCommissionsAll = totalCommissions + totalSalesCommission;
  const netProfit = combinedRevenue - totalCommissionsAll;
  
  const isNegative = netProfit < 0;

  return (
    <div className="dashboard-card p-6 h-full flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-bold mb-6 text-left flex items-center gap-2 border-b border-slate-800/60 pb-3">
          <TrendingUp className="w-5 h-5 text-[var(--accent)]" />
          Estadísticas Generales
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          {/* Columna Izquierda: Cantidades */}
          <div className="space-y-4">
            {/* Cortes */}
            <div className="kpi-card flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20 text-violet-400">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">
                    Total de Cortes
                  </span>
                  <span className="text-2xl font-extrabold text-white">
                    <CountUp start={0} end={totalAppt} duration={2} separator="." />
                  </span>
                </div>
              </div>
            </div>

            {/* Ventas */}
            <div className="kpi-card flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center border border-sky-500/20 text-sky-400">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">
                    Productos vendidos
                  </span>
                  <span className="text-2xl font-extrabold text-white">
                    <CountUp start={0} end={totalSales} duration={2} separator="." />
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Balances */}
          <div className="space-y-4">
            {/* Ingresos Totales */}
            <div className="kpi-card kpi-card--revenue flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">
                    Ingresos Totales
                  </span>
                  <span className="text-2xl font-extrabold text-emerald-400">
                    <CountUp start={0} end={combinedRevenue} duration={2} prefix="$" separator="." />
                  </span>
                </div>
              </div>
            </div>

            {/* Egresos */}
            <div className="kpi-card kpi-card--negative flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-400">
                  <ArrowDownRight className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">
                    Egresos (Comisiones)
                  </span>
                  <span className="text-2xl font-extrabold text-red-400">
                    <CountUp start={0} end={totalCommissionsAll} duration={2} prefix="$" separator="." />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ganancia Neta Destacada */}
        <div className={`kpi-card ${isNegative ? "kpi-card--negative bg-red-950/5" : "kpi-card--net bg-emerald-950/5"} p-5 flex items-center justify-between mb-8`}>
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-inner ${
              isNegative 
                ? "bg-red-500/10 border-red-500/30 text-red-400" 
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            }`}>
              {isNegative ? <AlertTriangle className="w-6 h-6" /> : <Coins className="w-6 h-6" />}
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">
                Ganancias Netas del Período
              </span>
              <span className={`text-3xl font-extrabold tracking-tight ${isNegative ? "text-red-500" : "text-emerald-400"}`}>
                <CountUp start={0} end={netProfit} duration={2} prefix="$" separator="." />
              </span>
            </div>
          </div>
          <span className={`text-xs font-bold uppercase px-3 py-1.5 rounded-full border ${
            isNegative 
              ? "bg-red-500/5 border-red-500/20 text-red-400" 
              : "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
          }`}>
            {isNegative ? "Saldo Deudor" : "Superávit"}
          </span>
        </div>
      </div>

      {paymentTotals && (
        <div className="pt-6 border-t border-slate-800/80">
          <h4 className="text-[10px] font-bold uppercase text-center mb-5 tracking-wider text-slate-400 flex items-center justify-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-[var(--accent)]" />
            Ingresos por Turnos según Método de Pago
          </h4>
          <div className="flex justify-center gap-6">
            <div className="payment-mini-card">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/25 text-amber-400 mb-2">
                <Wallet className="w-4 h-4" />
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-1">Efectivo</p>
              <p className="text-base font-extrabold text-white leading-none">
                ${paymentTotals.Efectivo.toLocaleString('es-AR')}
              </p>
            </div>

            <div className="payment-mini-card">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/25 text-blue-400 mb-2">
                <CreditCard className="w-4 h-4" />
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-1">Mercado Pago</p>
              <p className="text-base font-extrabold text-blue-400 leading-none">
                ${paymentTotals.MercadoPago.toLocaleString('es-AR')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}