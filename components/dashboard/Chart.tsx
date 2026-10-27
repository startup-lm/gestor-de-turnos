"use client";

import React, { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { DataPoint } from "@/lib/hooks/useDashboardData";
import { CalendarOff, BarChart3, DollarSign, Layers } from "lucide-react";

interface Props {
  data: DataPoint[];        // cortes
  salesData: DataPoint[];   // ventas
}

type CombinedPoint = {
  date: string;
  label: string;
  cortes: number;
  ventas: number;
  revenueCortes: number;
  revenueVentas: number;
};

export default function Chart({ data, salesData }: Readonly<Props>) {
  const [metricType, setMetricType] = useState<"count" | "revenue">("count");

  const combinedData = useMemo<CombinedPoint[]>(() => {
    const map = new Map<string, CombinedPoint>();

    // Cortes
    data.forEach((p) => {
      map.set(p.date, {
        date: p.date,
        label: p.label,
        cortes: p.count,
        ventas: 0,
        revenueCortes: p.revenue,
        revenueVentas: 0,
      });
    });

    // Ventas
    salesData.forEach((p) => {
      const existing = map.get(p.date);
      if (existing) {
        existing.ventas = p.count;
        existing.revenueVentas = p.revenue;
      } else {
        map.set(p.date, {
          date: p.date,
          label: p.label,
          cortes: 0,
          ventas: p.count,
          revenueCortes: 0,
          revenueVentas: p.revenue,
        });
      }
    });

    return Array.from(map.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [data, salesData]);

  // Verificar si existen datos reales para graficar
  const hasData = combinedData.length > 0 && combinedData.some(p => p.cortes > 0 || p.ventas > 0 || p.revenueCortes > 0 || p.revenueVentas > 0);

  if (!hasData) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-16 px-4 text-center bg-slate-950/20 rounded-2xl border border-slate-900 shadow-inner">
        <div className="w-14 h-14 rounded-full bg-[var(--accent)]/10 flex items-center justify-center mb-4 border border-[var(--accent)]/20 animate-pulse">
          <CalendarOff className="w-6 h-6 text-[var(--accent)]" />
        </div>
        <h3 className="text-base font-bold mb-1 text-white">Sin movimientos registrados</h3>
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
          No hay reservas ni ventas cargadas para este barbero en el rango seleccionado. Intentá seleccionando otro período.
        </p>
      </div>
    );
  }

  const isRevenue = metricType === "revenue";

  return (
    <div className="w-full">
      {/* Cabecera del Gráfico con Toggle Volumen vs Facturación */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-white/5">
        <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[var(--accent)]" />
          <span>Evolución Temporal ({isRevenue ? "Facturación en $" : "Volumen en Unidades"})</span>
        </h3>

        {/* Toggle Selector */}
        <div className="inline-flex items-center p-1 rounded-xl bg-slate-950/50 border border-white/10 text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMetricType("count")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              !isRevenue
                ? "!bg-[var(--accent)] !text-slate-950 font-bold shadow-sm"
                : "!text-slate-400 hover:!text-white hover:!bg-white/5"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Volumen</span>
          </button>
          <button
            type="button"
            onClick={() => setMetricType("revenue")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              isRevenue
                ? "!bg-[var(--accent)] !text-slate-950 font-bold shadow-sm"
                : "!text-slate-400 hover:!text-white hover:!bg-white/5"
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Facturación ($)</span>
          </button>
        </div>
      </div>
      
      <div className="w-full overflow-hidden">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={combinedData} margin={{ top: 10, right: 10, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(249, 250, 251, 0.05)" />
            <XAxis
              dataKey="label"
              tick={{ fill: "rgba(249, 250, 251, 0.5)", fontSize: 11, fontWeight: 600 }}
              axisLine={{ stroke: "rgba(249, 250, 251, 0.08)" }}
              tickLine={{ stroke: "rgba(249, 250, 251, 0.08)" }}
            />
            <YAxis
              allowDecimals={false}
              tickFormatter={(v) => (isRevenue ? `$${v.toLocaleString("es-AR")}` : String(v))}
              tick={{ fill: "rgba(249, 250, 251, 0.5)", fontSize: 10, fontWeight: 600 }}
              axisLine={{ stroke: "rgba(249, 250, 251, 0.08)" }}
              tickLine={{ stroke: "rgba(249, 250, 251, 0.08)" }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || payload.length === 0) return null;
                const p = payload[0].payload as CombinedPoint;
                return (
                  <div className="bg-slate-950/95 border border-white/10 rounded-xl p-3 shadow-2xl backdrop-blur-md">
                    <div className="font-bold text-[11px] text-[var(--accent)] uppercase tracking-wider mb-2 border-b border-white/10 pb-1.5">
                      {label}
                    </div>
                    <div className="space-y-2 text-xs min-w-[170px]">
                      {/* Cortes */}
                      <div className="flex justify-between items-center gap-4">
                        <span className="text-slate-300 font-medium flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[var(--accent)] inline-block" />
                          Turnos:
                        </span>
                        <span className="font-bold text-white">
                          {p.cortes} <span className="text-slate-400 font-normal">(${p.revenueCortes.toLocaleString("es-AR")})</span>
                        </span>
                      </div>

                      {/* Ventas */}
                      <div className="flex justify-between items-center gap-4">
                        <span className="text-slate-300 font-medium flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
                          Ventas:
                        </span>
                        <span className="font-bold text-white">
                          {p.ventas} <span className="text-slate-400 font-normal">(${p.revenueVentas.toLocaleString("es-AR")})</span>
                        </span>
                      </div>

                      {/* Total combinado */}
                      <div className="pt-2 border-t border-white/10 flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-semibold">Total día:</span>
                        <span className="font-extrabold text-emerald-400">
                          ${(p.revenueCortes + p.revenueVentas).toLocaleString("es-AR")}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <Legend 
              verticalAlign="top" 
              height={36} 
              iconType="circle"
              iconSize={8}
              wrapperStyle={{
                fontSize: 11,
                fontWeight: 600,
                color: "rgba(249, 250, 251, 0.7)",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}
            />
            <Bar
              dataKey={isRevenue ? "revenueCortes" : "cortes"}
              name={isRevenue ? "Facturación Cortes ($)" : "Turnos (Cant.)"}
              fill="var(--accent)"
              radius={[6, 6, 0, 0]}
              maxBarSize={38}
            />
            <Bar
              dataKey={isRevenue ? "revenueVentas" : "ventas"}
              name={isRevenue ? "Facturación Ventas ($)" : "Ventas (Cant.)"}
              fill="#38bdf8"
              radius={[6, 6, 0, 0]}
              maxBarSize={38}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
