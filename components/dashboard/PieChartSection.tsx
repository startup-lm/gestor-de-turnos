import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { PieData } from "@/lib/hooks/useBarberCutsdata";
import { PieChart as LucidePieChart } from "lucide-react";

const COLORS = [
  "var(--accent)",      // Dorado champagne
  "#38bdf8",            // Celeste Barber
  "#a78bfa",            // Violeta comisiones
  "#22c55e",            // Verde esmeralda
  "#f43f5e",            // Rosa barber pole
];

export default function PieChartSection({ data }: Readonly<{ data: PieData[] }>) {
  const hasData = data.length > 0 && data.some((entry) => entry.value > 0);

  return (
    <div className="dashboard-card p-6 h-full flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-bold mb-6 text-left flex items-center gap-2 border-b border-slate-800/60 pb-3">
          <LucidePieChart className="w-5 h-5 text-[var(--accent)]" />
          Cortes por Barbero
        </h3>
      </div>

      {!hasData ? (
        <div className="w-full flex flex-col items-center justify-center py-16 px-4 text-center bg-slate-950/20 rounded-2xl border border-slate-900 shadow-inner flex-1 my-auto">
          <div className="w-14 h-14 rounded-full bg-[var(--accent)]/10 flex items-center justify-center mb-4 border border-[var(--accent)]/20 animate-pulse">
            <LucidePieChart className="w-6 h-6 text-[var(--accent)]" />
          </div>
          <h3 className="text-base font-bold mb-1 text-white">Sin distribución</h3>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
            No se han registrado cortes de cabello para ningún profesional en las fechas seleccionadas.
          </p>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full">
            <div className="block md:hidden">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart margin={{ top: 10, bottom: 10 }}>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label
                    labelLine={false}
                  >
                    {data.map((entry, i) => (
                      <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(2, 6, 23, 0.95)",
                      borderRadius: "12px",
                      border: "1px solid rgba(249, 250, 251, 0.08)",
                      color: "white",
                      fontSize: "12px",
                    }}
                  />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="hidden md:block">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart margin={{ top: 20, bottom: 20, left: 10, right: 10 }}>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    cx="40%"
                    cy="50%"
                    outerRadius={95}
                    label
                    labelLine={false}
                  >
                    {data.map((entry, i) => (
                      <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(2, 6, 23, 0.95)",
                      borderRadius: "12px",
                      border: "1px solid rgba(249, 250, 251, 0.08)",
                      color: "white",
                      fontSize: "12px",
                    }}
                  />
                  <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

