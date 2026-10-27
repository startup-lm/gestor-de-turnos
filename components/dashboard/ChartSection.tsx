"use client";

import React from "react";
import Chart from "@/components/dashboard/Chart";
import { DataPoint, ViewMode } from "@/lib/hooks/useDashboardData";
import ViewModeChecklist from "./ViewModeChecklist";

interface Props {
  data: DataPoint[];
  salesData: DataPoint[];
  viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void;
}

export default function ChartSection({
  data,
  salesData,
  viewMode,
  onViewChange,
}: Readonly<Props>) {
  return (
    <div className="flex flex-col dashboard-card p-5 sm:p-6 justify-between gap-6 min-w-0 w-full">
      <div className="flex justify-between items-center flex-wrap gap-3 border-b border-white/5 pb-3">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Análisis de Actividad Temporal
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 font-semibold hidden sm:inline">Agrupar por:</span>
          <ViewModeChecklist viewMode={viewMode} onChange={onViewChange} />
        </div>
      </div>

      <div className="w-full min-h-[320px]">
        <Chart data={data} salesData={salesData} />
      </div>
    </div>
  );
}