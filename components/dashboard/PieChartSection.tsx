"use client";
import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { PieData } from "@/lib/hooks/useBarberCutsdata";

const COLORS = ["#0088FE","#00C49F","#FFBB28","#FF8042","#A28FD0"];

export default function PieChartSection({ data }: Readonly<{ data: PieData[] }>) {
  return (
    <div className="bg-[var(--bg-carousel)] rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4">Cortes por barbero</h3>

      <div className="block md:hidden">
        <ResponsiveContainer width="100%" height={300}>
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
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend layout="horizontal" verticalAlign="bottom" align="center" />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="hidden md:block">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart margin={{ top: 20, bottom: 20, left: 20, right: 20 }}>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
              labelLine={false}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend layout="vertical" verticalAlign="middle" align="right" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
