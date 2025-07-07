import React from "react";
import Chart from "@/components/dashboard/Chart";
import { DataPoint, ViewMode } from "@/lib/hooks/useDashboardData";
import ViewModeChecklist from "./ViewModeChecklist";
import Metrics from "./Metrics";

interface Props {
  data: DataPoint[];
  viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void;
  turnos: number;
  ingresos: number;
  comision: number;
}

export default function ChartSection({ data, viewMode, onViewChange, turnos, ingresos, comision }: Readonly<Props>) {
  return (
    <div className="flex flex-col flex-1 bg-[var(--bg-carousel)] rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <Metrics turnos={turnos} ingresos={ingresos} comision={comision} />
        <ViewModeChecklist viewMode={viewMode} onChange={onViewChange} />
      </div>

      <div className="flex-1 flex flex-col justify-end">
        <Chart data={data} />
      </div>
    </div>
  );
}