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

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Estadísticas</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={combinedData} style={{ backgroundColor: "var(--bg-carousel)" }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--heading-color)", fontSize: 12 }}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "var(--heading-color)", fontSize: 12 }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload || payload.length === 0) return null;
              const p = payload[0].payload as CombinedPoint;
              return (
                <div
                  style={{
                    backgroundColor: "#f0f0f0",
                    borderRadius: "5px",
                    border: "1px solid var(--secondary)",
                    color: "black",
                    padding: "0.5rem",
                  }}
                >
                  <div className="font-semibold mb-1">{label}</div>
                  <div>Turnos: {p.cortes}</div>
                  <div>
                    Ingresos cortes: $
                    {p.revenueCortes.toLocaleString("es-AR")}
                  </div>
                  <div>Ventas productos: {p.ventas}</div>
                  <div>
                    Ingresos ventas: $
                    {p.revenueVentas.toLocaleString("es-AR")}
                  </div>
                </div>
              );
            }}
          />
          <Legend />
          <Bar
            dataKey="cortes"
            name="Cortes"
            fill="var(--primary)"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="ventas"
            name="Ventas"
            fill="#38bdf8" // otro color; cámbialo si querés
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
