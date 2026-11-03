"use client";

import React, { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { PieData } from "@/lib/hooks/useBarberCutsdata";
import { PieChart as LucidePieChart, Award } from "lucide-react";

const COLORS = [
  "var(--accent)",      // Dorado champagne
  "var(--chart-1)",     // Celeste Barber
  "var(--chart-2)",     // Violeta comisiones
  "var(--chart-3)",     // Verde esmeralda
  "var(--chart-4)",     // Rosa barber pole
  "var(--chart-5)",     // Naranja
  "var(--chart-6)",     // Fucsia
];

export default function PieChartSection({ data }: Readonly<{ data: PieData[] }>) {
  const hasData = data.length > 0 && data.some((entry) => entry.value > 0);

  const totalTurnos = useMemo(() => {
    return data.reduce((acc, curr) => acc + (curr.value || 0), 0);
  }, [data]);

  const sortedBarbers = useMemo(() => {
    return [...data].sort((a, b) => b.value - a.value);
  }, [data]);

  return (
    <div className="dashboard-card p-6 h-full flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center border border-[var(--accent)]/20 text-[var(--accent)]">
            <LucidePieChart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Distribución de Turnos por Profesional
            </h3>
            <p className="text-xs text-slate-400">
              Proporción y ranking de turnos atendidos en el período
            </p>
          </div>
        </div>
        {hasData && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
            Total: {totalTurnos} turnos
          </span>
        )}
      </div>

      {!hasData ? (
        <div className="w-full flex flex-col items-center justify-center py-14 px-4 text-center bg-slate-950/20 rounded-2xl border border-slate-900 shadow-inner flex-1 my-auto">
          <div className="w-12 h-12 rounded-full bg-[var(--accent)]/10 flex items-center justify-center mb-3 border border-[var(--accent)]/20 animate-pulse">
            <LucidePieChart className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <h3 className="text-sm font-bold mb-1 text-white">Sin distribución registrada</h3>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
            No se han registrado turnos para ningún profesional en las fechas seleccionadas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Donut Chart con número central */}
          <div className="md:col-span-5 relative flex items-center justify-center min-h-[240px]">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={3}
                  stroke="rgba(15, 23, 42, 0.8)"
                  strokeWidth={2}
                >
                  {data.map((entry, i) => (
                    <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const item = payload[0];
                    const percent = totalTurnos > 0 ? ((Number(item.value) / totalTurnos) * 100).toFixed(1) : "0";
                    return (
                      <div className="bg-slate-950/95 border border-white/10 rounded-xl px-3 py-2 shadow-2xl backdrop-blur-md text-xs">
                        <span className="font-bold text-white block mb-0.5">{item.name}</span>
                        <div className="flex items-center gap-3 text-slate-300">
                          <span>{item.value} turnos</span>
                          <span className="font-bold text-[var(--accent)]">{percent}%</span>
                        </div>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Total en el centro del Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-white leading-none">{totalTurnos}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                Turnos
              </span>
            </div>
          </div>

          {/* Ranking y Barra de Desglose de Barberos */}
          <div className="md:col-span-7 space-y-3">
            {sortedBarbers.map((barber, index) => {
              const percent = totalTurnos > 0 ? Math.round((barber.value / totalTurnos) * 100) : 0;
              const color = COLORS[data.findIndex((d) => d.name === barber.name) % COLORS.length];

              return (
                <div key={barber.name} className="p-3 rounded-xl bg-slate-900/40 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                        style={{ backgroundColor: `${color}25`, color }}
                      >
                        {index === 0 ? <Award className="w-3.5 h-3.5" /> : index + 1}
                      </div>
                      <span className="font-semibold text-white truncate">{barber.name}</span>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-slate-400 font-medium">{barber.value} turnos</span>
                      <span className="font-bold text-xs" style={{ color }}>{percent}%</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
