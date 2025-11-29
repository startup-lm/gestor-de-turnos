import { useAuth } from "@/lib/auth/AuthContext";
import React from "react";
import CountUp from "react-countup";

interface Props {
  turnos: number;
  ventas: number;
  ingresos: number;
  comision: number;
  comisionVenta: number;
  ingresosVentas: number;
}

export default function Metrics({turnos, ventas, ingresos, comision, comisionVenta, ingresosVentas, }: Readonly<Props>) {
  const { role } = useAuth();
  const gananciaCortes = ingresos * comision;
  const gananciaVentas = ingresosVentas * comisionVenta;
  const gananciaTotal = gananciaCortes + gananciaVentas;

  if (role !== "admin") {
    return (
      <div className="px-4 py-2 text-gray-400 dark:text-gray-500 text-base">
        Ganancia:{" "}
        <span className="font-extrabold text-green-500">
          <CountUp
            start={0}
            end={gananciaTotal}
            duration={2}
            separator="."
            prefix="$"
          />
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-start gap-x-6 gap-y-1 text-base">
      <div className="flex flex-col gap-4 px-2 py-1 text-gray-400 dark:text-gray-500">
        <div>
          Cortes:{" "}
          <span className="font-extrabold text-white">
            <CountUp start={0} end={turnos} duration={2} separator="." />
          </span>
        </div>

        <div>
          Ingresos:{" "}
          <span className="font-extrabold text-green-500">
            <CountUp
              start={0}
              end={ingresos}
              duration={2}
              separator="."
              prefix="$"
            />
          </span>
        </div>
      </div>

      {/* Columna 2: Ventas */}
      <div className="flex flex-col gap-4 px-2 py-1 text-gray-400 dark:text-gray-500">
        <div>
          Productos vendidos:{" "}
          <span className="font-extrabold text-white">
            <CountUp start={0} end={ventas} duration={2} separator="." />
          </span>
        </div>

        <div>
          Ingresos por ventas:{" "}
          <span className="font-extrabold text-green-500">
            <CountUp
              start={0}
              end={ingresosVentas}
              duration={2}
              separator="."
              prefix="$"
            />
          </span>
        </div>
      </div>

      {/* Columna 3: Comisiones */}
      <div className="flex flex-col gap-4 px-2 py-1 text-gray-400 dark:text-gray-500">
        <div>
          Comisión por corte ({comision * 100}%):{" "}
          <span className="font-extrabold text-green-500">
            <CountUp
              start={0}
              end={gananciaCortes}
              duration={2}
              separator="."
              prefix="$"
            />
          </span>
        </div>

        <div>
          Comisión por venta ({comisionVenta * 100}%):{" "}
          <span className="font-extrabold text-green-500">
            <CountUp
              start={0}
              end={gananciaVentas}
              duration={2}
              separator="."
              prefix="$"
            />
          </span>
        </div>
      </div>
    </div>
  );
}