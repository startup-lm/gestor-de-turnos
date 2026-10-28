"use client";

import React, { useState, useEffect } from "react";
import { CashMovement } from "@/lib/types/cash";
import { getCashMovements, MovementFilterParams } from "@/lib/repository/cash";
import {
  TrendingDown,
  HandCoins,
  Receipt,
  Filter,
  Plus,
} from "lucide-react";

interface Props {
  startDate: Date;
  endDate: Date;
  refreshKey?: number;
  onOpenNewExpense: () => void;
  onOpenNewAdvance: () => void;
}

const formatLocalDate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function ExpensesHistoryTable({
  startDate,
  endDate,
  refreshKey,
  onOpenNewExpense,
  onOpenNewAdvance,
}: Readonly<Props>) {
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      try {
        const filter: MovementFilterParams = {
          startDate: formatLocalDate(startDate),
          endDate: formatLocalDate(endDate),
        };
        if (filterType !== "all") {
          filter.type = filterType;
        }
        const data = await getCashMovements(filter);
        if (isMounted) {
          // Filtrar en frontend si filterType es "all", excluyendo 'income' que viene de turnos
          const filtered = filterType === "all"
            ? data.filter((m) => m.type === "expense" || m.type === "advance" || m.type === "commission_payout")
            : data;
          setMovements(filtered);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [startDate, endDate, filterType, refreshKey]);

  const totalAmount = movements.reduce((sum, m) => sum + Number(m.amount), 0);

  const getCategoryBadge = (type: string, category: string) => {
    if (type === "advance") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
          <HandCoins className="w-3 h-3" />
          <span>Adelanto Barbero</span>
        </span>
      );
    }
    if (type === "commission_payout") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-[10px] font-bold">
          <Receipt className="w-3 h-3" />
          <span>Pago Comisión</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-300 text-[10px] font-bold">
        <TrendingDown className="w-3 h-3" />
        <span className="capitalize">{category}</span>
      </span>
    );
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Barra de Filtros y Botones */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/40 p-3.5 rounded-xl border border-white/5">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[var(--accent)]" />
          <span className="text-xs font-bold text-white">Filtrar:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="p-1.5 rounded-lg border border-white/10 bg-slate-950 text-xs text-white focus:border-[var(--accent)] outline-none"
          >
            <option value="all">Todos los egresos y adelantos</option>
            <option value="expense">Solo gastos del local</option>
            <option value="advance">Solo adelantos a barberos</option>
            <option value="commission_payout">Solo pagos de liquidaciones</option>
          </select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onOpenNewAdvance}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold transition-all cursor-pointer"
          >
            <HandCoins className="w-3.5 h-3.5" />
            <span>Adelanto</span>
          </button>
          <button
            type="button"
            onClick={onOpenNewExpense}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg !bg-red-500 hover:!bg-red-600 !text-white text-xs font-bold shadow-md shadow-red-500/15 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Nuevo Gasto</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 rounded-2xl bg-slate-900/30 border border-white/5 text-center text-xs text-slate-400 animate-pulse">
          Cargando movimientos de gastos y adelantos...
        </div>
      ) : movements.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900/20 border border-white/5 text-center space-y-2">
          <TrendingDown className="w-8 h-8 text-slate-500 mx-auto" />
          <h4 className="text-sm font-bold text-white">No hay egresos en este período</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Podés registrar los gastos del local (insumos, servicios) y adelantos a tu personal para deducirlos automáticamente de tus ganancias reales.
          </p>
        </div>
      ) : (
        <>
          {/* TABLA DESKTOP */}
          <div className="hidden lg:block overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/30">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-[10px] tracking-wider text-slate-400">
                  <th className="py-3 px-4">Fecha y Hora</th>
                  <th className="py-3 px-4">Tipo / Categoría</th>
                  <th className="py-3 px-4">Concepto / Descripción</th>
                  <th className="py-3 px-4">Destinatario / Barbero</th>
                  <th className="py-3 px-4">Medio de Pago</th>
                  <th className="py-3 px-4 text-right font-bold text-red-400">Importe ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {movements.map((m) => {
                  const dateObj = new Date(m.created_at);
                  const formattedDate = dateObj.toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 text-slate-300 text-[11px] font-mono">
                        {formattedDate}
                      </td>
                      <td className="py-3 px-4">
                        {getCategoryBadge(m.type, m.category)}
                      </td>
                      <td className="py-3 px-4 text-white font-medium">
                        {m.description}
                        {m.reference_code && (
                          <span className="block text-[10px] text-slate-400">
                            Ref: {m.reference_code}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {m.barbers?.name ? (
                          <span className="font-semibold text-white">{m.barbers.name}</span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px]">
                          {m.payment_method}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-sm text-red-400">
                        -${Number(m.amount).toLocaleString("es-AR")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-white/10 bg-white/[0.02] text-xs font-bold text-white">
                  <td colSpan={5} className="py-3 px-4 text-right text-slate-400">
                    Total egresos en el período seleccionado:
                  </td>
                  <td className="py-3 px-4 text-right text-red-400 text-sm font-black">
                    -${totalAmount.toLocaleString("es-AR")}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* LISTA MOBILE */}
          <div className="lg:hidden space-y-3">
            {movements.map((m) => {
              const dateObj = new Date(m.created_at);
              const formattedDate = dateObj.toLocaleDateString("es-AR", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={m.id}
                  className="p-4 rounded-xl bg-slate-900/50 border border-white/10 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div>{getCategoryBadge(m.type, m.category)}</div>
                    <span className="text-sm font-extrabold text-red-400">
                      -${Number(m.amount).toLocaleString("es-AR")}
                    </span>
                  </div>

                  <div>
                    <h5 className="text-xs font-bold text-white">{m.description}</h5>
                    {m.barbers?.name && (
                      <p className="text-[11px] text-amber-300 mt-0.5 font-medium">
                        Profesional: {m.barbers.name}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/5">
                    <span>{formattedDate}</span>
                    <span>{m.payment_method}</span>
                  </div>
                </div>
              );
            })}

            <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/20 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300">Total egresos:</span>
              <span className="font-extrabold text-red-400 text-sm">
                -${totalAmount.toLocaleString("es-AR")}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
