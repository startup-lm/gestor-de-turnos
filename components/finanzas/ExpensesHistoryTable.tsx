"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { CashMovement } from "@/lib/types/cash";
import { getCashMovements, MovementFilterParams, voidCashMovement } from "@/lib/repository/cash";
import { formatLocalDate } from "@/lib/dates/argentina";
import { toast } from "@/lib/store/useToastStore";
import { formatARS } from "@/lib/format/currency";
import {
  TrendingDown,
  HandCoins,
  Receipt,
  Filter,
  Loader2,
} from "lucide-react";

interface Props {
  startDate: Date;
  endDate: Date;
  refreshKey?: number;
}

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return "";
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }
  const dateObj = new Date(dateStr);
  if (isNaN(dateObj.getTime())) return dateStr;
  const d = String(dateObj.getDate()).padStart(2, "0");
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const y = dateObj.getFullYear();
  const hr = String(dateObj.getHours()).padStart(2, "0");
  const min = String(dateObj.getMinutes()).padStart(2, "0");
  return `${d}/${m}/${y}, ${hr}:${min}`;
}

export default function ExpensesHistoryTable({
  startDate,
  endDate,
  refreshKey,
}: Readonly<Props>) {
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [confirmingVoidId, setConfirmingVoidId] = useState<number | null>(null);
  const [voidingId, setVoidingId] = useState<number | null>(null);

  const loadMovements = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const filter: MovementFilterParams = {
        startDate: formatLocalDate(startDate),
        endDate: formatLocalDate(endDate),
      };
      if (filterType !== "all") {
        filter.type = filterType;
      }
      const data = await getCashMovements(filter);
      // Filtrar en frontend si filterType es "all", excluyendo 'income' que viene de turnos
      const filtered =
        filterType === "all"
          ? data.filter(
              (m) =>
                m.type === "expense" ||
                m.type === "withdrawal" ||
                m.type === "advance" ||
                m.type === "commission_payout"
            )
          : data;
      setMovements(filtered);
    } catch (err) {
      console.error(err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, filterType]);

  useEffect(() => {
    loadMovements();
  }, [loadMovements, refreshKey]);

  const activeMovements = useMemo(
    () => movements.filter((m) => !m.voided_at),
    [movements]
  );
  const totalAmount = useMemo(
    () => activeMovements.reduce((sum, m) => sum + Number(m.amount), 0),
    [activeMovements]
  );

  const handleVoid = async (id: number) => {
    setVoidingId(id);
    try {
      const res = await voidCashMovement(id);
      if (res.success) {
        toast.success("Movimiento anulado");
        setConfirmingVoidId(null);
        await loadMovements();
      } else {
        toast.error(res.error || "No se pudo anular el movimiento");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al anular el movimiento");
    } finally {
      setVoidingId(null);
    }
  };

  const getCategoryBadge = (type: string, category: string) => {
    if (type === "advance") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
          <HandCoins className="w-3 h-3" />
          <span>Adelanto a barbero</span>
        </span>
      );
    }
    if (type === "commission_payout") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-[10px] font-bold">
          <Receipt className="w-3 h-3" />
          <span>Pago de comisión</span>
        </span>
      );
    }
    if (type === "withdrawal") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 text-[10px] font-bold">
          <HandCoins className="w-3 h-3" />
          <span>Retiro del dueño</span>
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

  const renderAction = (m: CashMovement) => {
    if (m.voided_at) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/15 border border-red-500/30 text-red-400">
          Anulado
        </span>
      );
    }

    if (m.type === "commission_payout") {
      return (
        <span className="text-[11px] text-slate-500">Ver en liquidaciones</span>
      );
    }

    if (m.type === "advance" && m.payout_id != null) {
      return (
        <span className="text-[11px] text-slate-500">
          Descontado en la liquidación #{m.payout_id}
        </span>
      );
    }

    const isConfirming = confirmingVoidId === m.id;
    const isVoiding = voidingId === m.id;

    if (isConfirming) {
      return (
        <div className="inline-flex items-center gap-2">
          <span className="text-[11px] text-slate-300">¿Anular el movimiento?</span>
          <button
            type="button"
            disabled={isVoiding}
            onClick={() => handleVoid(m.id)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {isVoiding && <Loader2 className="w-3 h-3 animate-spin" />}
            <span>Sí, anular</span>
          </button>
          <button
            type="button"
            disabled={isVoiding}
            onClick={() => setConfirmingVoidId(null)}
            className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all cursor-pointer disabled:opacity-50"
          >
            No
          </button>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={() => setConfirmingVoidId(m.id)}
        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/5 border border-white/10 text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
      >
        Anular
      </button>
    );
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/40 p-3.5 rounded-xl border border-white/5">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[var(--accent)]" />
          <span className="text-xs font-bold text-white">Filtrar:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="p-1.5 rounded-lg border border-white/10 bg-slate-950 text-xs text-white focus:border-[var(--accent)] outline-none min-h-[44px] sm:min-h-0"
          >
            <option value="all">Todos los egresos y adelantos</option>
            <option value="expense">Solo gastos del local</option>
            <option value="withdrawal">Solo retiros del dueño</option>
            <option value="advance">Solo adelantos a barberos</option>
            <option value="commission_payout">Solo pagos de liquidaciones</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-8 rounded-2xl bg-slate-900/30 border border-white/5 text-center text-xs text-slate-400 animate-pulse">
          Cargando movimientos de gastos y adelantos...
        </div>
      ) : loadError ? (
        <div className="p-12 rounded-2xl bg-red-950/20 border border-red-500/20 text-center space-y-2">
          <p className="text-xs text-red-300">No se pudieron cargar los movimientos. Probá de nuevo.</p>
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
                  <th className="py-3 px-4">Fecha y hora</th>
                  <th className="py-3 px-4">Tipo / categoría</th>
                  <th className="py-3 px-4">Concepto / descripción</th>
                  <th className="py-3 px-4">Destinatario / profesional</th>
                  <th className="py-3 px-4">Medio de pago</th>
                  <th className="py-3 px-4 text-right font-bold text-red-400">Importe ($)</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {movements.map((m) => {
                  const formattedDate = formatDateTime(m.created_at);
                  const isVoided = !!m.voided_at;

                  return (
                    <tr
                      key={m.id}
                      className={`hover:bg-white/[0.02] transition-colors ${
                        isVoided ? "opacity-50" : ""
                      }`}
                    >
                      <td className="py-3 px-4 text-slate-300 text-[11px] font-mono">
                        {formattedDate}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getCategoryBadge(m.type, m.category)}
                          {isVoided && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/15 border border-red-500/30 text-red-400">
                              Anulado
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={`py-3 px-4 text-white font-medium ${isVoided ? "line-through text-slate-400" : ""}`}>
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
                      <td className={`py-3 px-4 text-right font-extrabold text-sm text-red-400 ${isVoided ? "line-through text-slate-400" : ""}`}>
                        -{formatARS(m.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {renderAction(m)}
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
                    -{formatARS(totalAmount)}
                  </td>
                  <td className="py-3 px-4" />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* LISTA MOBILE */}
          <div className="lg:hidden space-y-3">
            {movements.map((m) => {
              const formattedDate = formatDateTime(m.created_at);
              const isVoided = !!m.voided_at;
              const isConfirming = confirmingVoidId === m.id;
              const isVoiding = voidingId === m.id;

              return (
                <div
                  key={m.id}
                  className={`p-4 rounded-xl bg-slate-900/50 border border-white/10 space-y-2.5 ${
                    isVoided ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryBadge(m.type, m.category)}
                      {isVoided && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/15 border border-red-500/30 text-red-400">
                          Anulado
                        </span>
                      )}
                    </div>
                    <span className={`text-sm font-extrabold text-red-400 ${isVoided ? "line-through text-slate-400" : ""}`}>
                      -{formatARS(m.amount)}
                    </span>
                  </div>

                  <div>
                    <h5 className={`text-xs font-bold text-white ${isVoided ? "line-through text-slate-400" : ""}`}>
                      {m.description}
                    </h5>
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

                  <div className="pt-2 border-t border-white/5">
                    {isVoided ? (
                      <div className="text-right">
                        <span className="text-[11px] text-slate-500">Movimiento anulado</span>
                      </div>
                    ) : m.type === "commission_payout" ? (
                      <div className="text-right">
                        <span className="text-[11px] text-slate-500">Ver en liquidaciones</span>
                      </div>
                    ) : m.type === "advance" && m.payout_id != null ? (
                      <div className="text-right">
                        <span className="text-[11px] text-slate-500">
                          Descontado en la liquidación #{m.payout_id}
                        </span>
                      </div>
                    ) : isConfirming ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-xs text-slate-300">¿Anular el movimiento?</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={isVoiding}
                            onClick={() => handleVoid(m.id)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 transition-all cursor-pointer disabled:opacity-50 min-h-[44px] sm:min-h-0 flex-1 sm:flex-none"
                          >
                            {isVoiding && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            <span>Sí, anular</span>
                          </button>
                          <button
                            type="button"
                            disabled={isVoiding}
                            onClick={() => setConfirmingVoidId(null)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all cursor-pointer disabled:opacity-50 min-h-[44px] sm:min-h-0 flex-1 sm:flex-none text-center"
                          >
                            No
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => setConfirmingVoidId(m.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-red-400 hover:bg-red-500/10 transition-all cursor-pointer min-h-[44px] sm:min-h-0"
                        >
                          Anular
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/20 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300">Total egresos:</span>
              <span className="font-extrabold text-red-400 text-sm">
                -{formatARS(totalAmount)}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
