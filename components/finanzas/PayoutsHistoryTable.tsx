"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Barber } from "@/lib/types/Barbers";
import { CommissionPayout } from "@/lib/types/cash";
import { getCommissionPayouts, voidCommissionPayout } from "@/lib/repository/cash";
import { buildPayoutWhatsAppText } from "@/lib/finance/payoutText";
import { toast } from "@/lib/store/useToastStore";
import {
  FileText,
  Copy,
  Check,
  Banknote,
  Wallet,
  Filter,
  Loader2,
} from "lucide-react";

interface Props {
  barbers: Barber[];
  refreshKey?: number;
}

export default function PayoutsHistoryTable({ barbers, refreshKey }: Readonly<Props>) {
  const [payouts, setPayouts] = useState<CommissionPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedBarberId, setSelectedBarberId] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [confirmingVoidId, setConfirmingVoidId] = useState<number | null>(null);
  const [voidingId, setVoidingId] = useState<number | null>(null);

  const loadPayouts = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const filter = selectedBarberId !== "all" ? { barberId: Number(selectedBarberId) } : undefined;
      const data = await getCommissionPayouts(filter);
      setPayouts(data);
    } catch (err) {
      console.error(err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [selectedBarberId]);

  useEffect(() => {
    loadPayouts();
  }, [loadPayouts, refreshKey]);

  const activePayouts = useMemo(() => payouts.filter((p) => !p.voided_at), [payouts]);

  const handleCopyWhatsApp = (p: CommissionPayout) => {
    const barberName = p.barbers?.name || "Profesional";
    const text = buildPayoutWhatsAppText(p, barberName);

    if (typeof window !== "undefined" && navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(p.id);
      setTimeout(() => setCopiedId(null), 2500);
      toast.success("Recibo copiado para WhatsApp");
    }
  };

  const handleVoid = async (id: number) => {
    setVoidingId(id);
    try {
      const res = await voidCommissionPayout(id);
      if (res.success) {
        toast.success("Liquidación anulada");
        setConfirmingVoidId(null);
        await loadPayouts();
      } else {
        toast.error(res.error || "No se pudo anular la liquidación");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al anular la liquidación");
    } finally {
      setVoidingId(null);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/40 p-3.5 rounded-xl border border-white/5">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[var(--accent)]" />
          <span className="text-xs font-bold text-white">Filtrar por profesional:</span>
          <select
            value={selectedBarberId}
            onChange={(e) => setSelectedBarberId(e.target.value)}
            className="p-1.5 rounded-lg border border-white/10 bg-slate-950 text-xs text-white focus:border-[var(--accent)] outline-none min-h-[44px] sm:min-h-0"
          >
            <option value="all">Todos los profesionales</option>
            {barbers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-400">
          Total registros: <strong className="text-white">{activePayouts.length}</strong>
        </span>
      </div>

      {loading ? (
        <div className="p-8 rounded-2xl bg-slate-900/30 border border-white/5 text-center text-xs text-slate-400 animate-pulse">
          Cargando historial de liquidaciones...
        </div>
      ) : loadError ? (
        <div className="p-12 rounded-2xl bg-red-950/20 border border-red-500/20 text-center space-y-2">
          <p className="text-xs text-red-300">No se pudo cargar el historial. Probá de nuevo.</p>
        </div>
      ) : payouts.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900/20 border border-white/5 text-center space-y-2">
          <FileText className="w-8 h-8 text-slate-500 mx-auto" />
          <h4 className="text-sm font-bold text-white">No hay liquidaciones registradas</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Cuando registres una liquidación con «Nueva liquidación», va a aparecer acá.
          </p>
        </div>
      ) : (
        <>
          {/* TABLA DESKTOP */}
          <div className="hidden lg:block overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/30">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-[10px] tracking-wider text-slate-400">
                  <th className="py-3 px-4">Comprobante</th>
                  <th className="py-3 px-4">Fecha de pago</th>
                  <th className="py-3 px-4">Profesional</th>
                  <th className="py-3 px-4">Período liquidado</th>
                  <th className="py-3 px-4 text-center">Cortes / ventas</th>
                  <th className="py-3 px-4 text-right">Adelantos</th>
                  <th className="py-3 px-4 text-right font-bold text-emerald-400">Total abonado</th>
                  <th className="py-3 px-4">Medio de pago</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {payouts.map((p) => {
                  const isCopied = copiedId === p.id;
                  const isVoided = !!p.voided_at;
                  const isConfirming = confirmingVoidId === p.id;
                  const isVoiding = voidingId === p.id;

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-white/[0.02] transition-colors ${
                        isVoided ? "opacity-50" : ""
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-[var(--accent)]">
                        <div className="flex items-center gap-2">
                          <span>#{p.id}</span>
                          {isVoided && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/15 border border-red-500/30 text-red-400">
                              Anulada
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {p.payment_date}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        {p.barbers?.name || "Profesional"}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {p.period_start} al {p.period_end}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-300">
                        <span className="font-semibold">{p.cuts_count}</span> cortes •{" "}
                        <span className="font-semibold">{p.sales_count}</span> prod.
                      </td>
                      <td className="py-3 px-4 text-right text-amber-400 font-medium">
                        {p.advances_deducted > 0
                          ? `-$${Math.round(p.advances_deducted).toLocaleString("es-AR")}`
                          : "—"}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-sm text-emerald-400">
                        ${Math.round(p.total_paid).toLocaleString("es-AR")}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px]">
                          {p.payment_method === "Efectivo" ? (
                            <Banknote className="w-3 h-3 text-amber-400" />
                          ) : (
                            <Wallet className="w-3 h-3 text-purple-400" />
                          )}
                          <span>{p.payment_method}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isVoided ? (
                          <span className="text-[11px] text-slate-500 font-medium">—</span>
                        ) : isConfirming ? (
                          <div className="inline-flex items-center gap-2">
                            <span className="text-[11px] text-slate-300">¿Anular la liquidación?</span>
                            <button
                              type="button"
                              disabled={isVoiding}
                              onClick={() => handleVoid(p.id)}
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
                        ) : (
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleCopyWhatsApp(p)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border ${
                                isCopied
                                  ? "!bg-emerald-500/20 !border-emerald-500/40 !text-emerald-400"
                                  : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
                              }`}
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span>Copiado</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>WhatsApp</span>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmingVoidId(p.id)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/5 border border-white/10 text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                            >
                              Anular
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* LISTA MOBILE */}
          <div className="lg:hidden space-y-3">
            {payouts.map((p) => {
              const isCopied = copiedId === p.id;
              const isVoided = !!p.voided_at;
              const isConfirming = confirmingVoidId === p.id;
              const isVoiding = voidingId === p.id;

              return (
                <div
                  key={p.id}
                  className={`p-4 rounded-xl bg-slate-900/50 border border-white/10 space-y-3 ${
                    isVoided ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-0.5 rounded border border-[var(--accent)]/20">
                        #{p.id}
                      </span>
                      <span className="text-xs font-bold text-white">
                        {p.barbers?.name || "Profesional"}
                      </span>
                      {isVoided && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/15 border border-red-500/30 text-red-400">
                          Anulada
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-extrabold text-emerald-400">
                      ${Math.round(p.total_paid).toLocaleString("es-AR")}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 space-y-1">
                    <div>
                      <span>Período: </span>
                      <strong className="text-slate-300">{p.period_start} al {p.period_end}</strong>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>Fecha de pago: </span>
                      <strong className="text-slate-300">{p.payment_date}</strong> •
                      <span className="inline-flex items-center gap-1 text-slate-300">
                        {p.payment_method === "Efectivo" ? (
                          <Banknote className="w-3 h-3 text-amber-400" />
                        ) : (
                          <Wallet className="w-3 h-3 text-purple-400" />
                        )}
                        <span>{p.payment_method}</span>
                      </span>
                    </div>
                    {p.advances_deducted > 0 && (
                      <div className="text-amber-400">
                        Adelantos descontados: -${Math.round(p.advances_deducted).toLocaleString("es-AR")}
                      </div>
                    )}
                  </div>

                  {!isVoided && (
                    <div className="pt-2 border-t border-white/5">
                      {isConfirming ? (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="text-xs text-slate-300">¿Anular la liquidación?</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={isVoiding}
                              onClick={() => handleVoid(p.id)}
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
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyWhatsApp(p)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border min-h-[44px] sm:min-h-0 ${
                              isCopied
                                ? "!bg-emerald-500/20 !border-emerald-500/40 !text-emerald-400"
                                : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                            }`}
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Recibo copiado</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copiar para WhatsApp</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmingVoidId(p.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-red-400 hover:bg-red-500/10 transition-all cursor-pointer min-h-[44px] sm:min-h-0"
                          >
                            Anular
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
