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
    <div className="flex flex-col flex-1 dashboard-card p-6 justify-between gap-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <Metrics turnos={turnos} ventas={ventas} ingresos={ingresos} comision={comision} comisionVenta={comisionVenta} ingresosVentas={ingresosVentas}/>
        <div className="flex-shrink-0 self-end xl:self-auto">
          <ViewModeChecklist viewMode={viewMode} onChange={onViewChange} />
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-end mt-4">
        <Chart data={data} salesData={salesData}/>
      </div>
    </div>
  );
}