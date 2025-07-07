  "use client";

  import CountUp from "react-countup";
  import { BarberTotalData } from "@/lib/hooks/useBarberCutsdata";
  import { TotalSalesData } from "@/lib/hooks/useTotalSalesRevenue";

  interface SummaryProps {
    data: BarberTotalData;
    salesData: TotalSalesData;
    totalCommissions: number;
  }

  export default function Summary({ data, salesData, totalCommissions }: Readonly<SummaryProps>) {
    const { totalAppt, totalRevenue } = data;
    const { totalSalesRevenue, totalSales } = salesData;
    const combinedRevenue = totalRevenue + totalSalesRevenue;
    const netProfit = combinedRevenue - totalCommissions;

  return (
    <div className="bg-[var(--bg-carousel)] p-4 rounded-lg shadow-xl h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-2 text-left">
        Estadísticas Barbería
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
        {/* Left column */}
        <div className="flex flex-col items-center justify-center gap-8">
          {/* Total de cortes */}
          <div className="flex flex-col items-center">
            <span className="text-base font-medium uppercase text-[var(--button-home-disabled)] tracking-wide">
              Total de cortes
            </span>
            <span className="mt-2 text-5xl font-extrabold text-gray-900 dark:text-white">
              <CountUp start={0} end={totalAppt} duration={2} separator="." />
            </span>
          </div>

          {/* Total productos vendidos */}
          <div className="flex flex-col items-center">
            <span className="text-base font-medium uppercase text-[var(--button-home-disabled)] tracking-wide">
              Total productos vendidos
            </span>
            <span className="mt-2 text-5xl font-extrabold text-blue-600 dark:text-blue-400">
              <CountUp start={0} end={totalSales} duration={2} separator="." />
            </span>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col items-center justify-center gap-8">
          {/* Ingresos totales */}
          <div className="flex flex-col items-center">
            <span className="text-base font-medium uppercase text-[var(--button-home-disabled)] tracking-wide">
              Ingresos totales
            </span>
            <span className="mt-2 text-5xl font-extrabold text-emerald-500">
              <CountUp start={0} end={combinedRevenue} duration={2} prefix="$" separator="." />
            </span>
          </div>

          {/* Egresos */}
          <div className="flex flex-col items-center">
            <span className="text-base font-medium uppercase text-[var(--button-home-disabled)] tracking-wide">
              Egresos
            </span>
            <span className="mt-2 text-5xl font-extrabold text-red-500">
              <CountUp start={0} end={totalCommissions} duration={2} prefix="$" separator="." />
            </span>
          </div>

          {/* Ganancias */}
          <div className="flex flex-col items-center">
            <span className="text-base font-medium uppercase text-[var(--button-home-disabled)] tracking-wide">
              Ganancias
            </span>
            <span className="mt-2 text-5xl font-extrabold text-green-600">
              <CountUp start={0} end={netProfit} duration={2} prefix="$" separator="." />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}