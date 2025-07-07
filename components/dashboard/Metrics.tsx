import { useAuth } from "@/lib/auth/AuthContext";
import React from "react";
import CountUp from "react-countup";

interface Props {
  turnos: number;
  ingresos: number;
  comision: number;
}

export default function Metrics({ turnos, ingresos, comision }: Readonly<Props>) {
  const { role } = useAuth();
  return (
    <div className="justify-between items-center gap-4 text-md">
      <div className="px-4 py-2 text-gray-400 dark:text-gray-500">
        Cortes: <span className="font-extrabold text-white"><CountUp start={0} end={turnos} duration={2} separator="." /></span>
      </div>
      {role === "admin" ? (
        <>
          <div className="px-4 py-2 text-gray-400 dark:text-gray-500">
            Ingresos: <span className="font-extrabold text-green-500"><CountUp start={0} end={ingresos} duration={2} separator="." prefix="$" /></span>
          </div><div className="px-4 py-2 text-gray-400 dark:text-gray-500">
            Comisión ({comision * 100}%): <span className="font-extrabold text-green-500"><CountUp start={0} end={ingresos * comision} duration={2} separator="." prefix="$" /></span>
          </div>
        </>
      ) : (
        <div className="px-4 py-2 text-gray-400 dark:text-gray-500">
          Ganancia: <span className="font-extrabold text-green-500"><CountUp start={0} end={ingresos * comision} duration={2} separator="." prefix="$" /></span>
        </div>
      )}
    </div>
  );
}