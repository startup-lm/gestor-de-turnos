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
    <div className="flex flex-col flex-1 bg-[var(--bg-carousel)] rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <Metrics turnos={turnos} ventas={ventas} ingresos={ingresos} comision={comision} comisionVenta={comisionVenta} ingresosVentas={ingresosVentas}/>
        <ViewModeChecklist viewMode={viewMode} onChange={onViewChange} />
      </div>

      <div className="flex-1 flex flex-col justify-end">
        <Chart data={data} salesData={salesData}/>
      </div>
    </div>
  );
}