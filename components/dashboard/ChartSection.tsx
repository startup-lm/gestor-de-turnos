import React from "react";
import Chart from "@/components/dashboard/Chart";
import { DataPoint, ViewMode } from "@/lib/hooks/useDashboardData";
import ViewModeChecklist from "./ViewModeChecklist";
import Metrics from "./Metrics";

interface Props {
  data: DataPoint[];
  salesData: DataPoint[];
  viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void;
  turnos: number;
  ventas: number;
  ingresos: number;
  comision: number;
  comisionVenta: number;
  ingresosVentas: number;
}

export default function ChartSection({ data, salesData, viewMode, onViewChange, turnos, ventas, ingresos, comision, comisionVenta, ingresosVentas }: Readonly<Props>) {
  return (
    <div className="flex flex-col flex-1 dashboard-card p-5 sm:p-6 justify-between gap-6 min-w-0">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center flex-wrap gap-3 border-b border-slate-800/40 pb-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Resumen de Actividad
          </span>
          <div className="flex-shrink-0">
            <ViewModeChecklist viewMode={viewMode} onChange={onViewChange} />
          </div>
        </div>
        <Metrics turnos={turnos} ventas={ventas} ingresos={ingresos} comision={comision} comisionVenta={comisionVenta} ingresosVentas={ingresosVentas}/>
      </div>

      <div className="flex-1 flex flex-col justify-end mt-4 min-h-[300px]">
        <Chart data={data} salesData={salesData}/>
      </div>
    </div>
  );
}