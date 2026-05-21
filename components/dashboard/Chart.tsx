import React, { useMemo } from "react";
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
import { CalendarOff, BarChart3 } from "lucide-react";

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
  const hasData = combinedData.length > 0 && combinedData.some(p => p.cortes > 0 || p.ventas > 0);

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

  return (
    <div className="w-full">
      <h3 className="text-sm font-bold uppercase text-slate-400 mb-4 tracking-wider flex items-center gap-1.5">
        <BarChart3 className="w-4 h-4 text-[var(--accent)]" />
        Evolución Temporal
      </h3>
      
      <div className="w-full overflow-hidden">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={combinedData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(249, 250, 251, 0.05)" />
            <XAxis
              dataKey="label"
              tick={{ fill: "rgba(249, 250, 251, 0.4)", fontSize: 10, fontWeight: 600 }}
              axisLine={{ stroke: "rgba(249, 250, 251, 0.08)" }}
              tickLine={{ stroke: "rgba(249, 250, 251, 0.08)" }}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "rgba(249, 250, 251, 0.4)", fontSize: 10, fontWeight: 600 }}
              axisLine={{ stroke: "rgba(249, 250, 251, 0.08)" }}
              tickLine={{ stroke: "rgba(249, 250, 251, 0.08)" }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || payload.length === 0) return null;
                const p = payload[0].payload as CombinedPoint;
                return (
                  <div className="bg-slate-950/95 border border-slate-800 rounded-xl p-3 shadow-2xl backdrop-blur-md">
                    <div className="font-bold text-[10px] text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-800 pb-1.5">
                      {label}
                    </div>
                    <div className="space-y-1.5 text-xs min-w-[150px]">
                      <div className="flex justify-between gap-6">
                        <span className="text-slate-400 font-medium">Turnos:</span>
                        <span className="font-bold text-white">{p.cortes}</span>
                      </div>
                      <div className="flex justify-between gap-6 text-emerald-400 font-semibold pl-2">
                        <span>Ingresos cortes:</span>
                        <span>${p.revenueCortes.toLocaleString("es-AR")}</span>
                      </div>
                      <div className="flex justify-between gap-6 pt-1.5 mt-1 border-t border-slate-800/60">
                        <span className="text-slate-400 font-medium">Ventas:</span>
                        <span className="font-bold text-white">{p.ventas}</span>
                      </div>
                      <div className="flex justify-between gap-6 text-sky-400 font-semibold pl-2">
                        <span>Ingresos ventas:</span>
                        <span>${p.revenueVentas.toLocaleString("es-AR")}</span>
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
                color: "rgba(249, 250, 251, 0.6)",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}
            />
            <Bar
              dataKey="cortes"
              name="Turnos"
              fill="var(--accent)"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
            <Bar
              dataKey="ventas"
              name="Ventas"
              fill="#38bdf8"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

