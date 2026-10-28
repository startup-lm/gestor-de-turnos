"use client";

import React, { useState, useEffect } from "react";
import { Barber } from "@/lib/types/Barbers";
import { CommissionPayout } from "@/lib/types/cash";
import { getCommissionPayouts } from "@/lib/repository/cash";
import { toast } from "@/lib/store/useToastStore";
import {
  FileText,
  Copy,
  Check,
  Banknote,
  ArrowRightLeft,
  Filter,
} from "lucide-react";

interface Props {
  barbers: Barber[];
  refreshKey?: number;
}

export default function PayoutsHistoryTable({ barbers, refreshKey }: Readonly<Props>) {
  const [payouts, setPayouts] = useState<CommissionPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBarberId, setSelectedBarberId] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      try {
        const filter = selectedBarberId !== "all" ? { barberId: Number(selectedBarberId) } : undefined;
        const data = await getCommissionPayouts(filter);
        if (isMounted) setPayouts(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [selectedBarberId, refreshKey]);

  const handleCopyWhatsApp = (p: CommissionPayout) => {
    const barberName = p.barbers?.name || "Profesional";
    const text =
      `💈 *RECIBO DE LIQUIDACIÓN #${p.id}*\n` +
      `👤 *Profesional:* ${barberName}\n` +
      `📅 *Período liquidado:* ${p.period_start} al ${p.period_end}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `✂️ *Cortes (${p.cuts_count} turnos):* $${Math.round(p.cuts_commission_amount).toLocaleString("es-AR")}\n` +
      `🛍️ *Ventas (${p.sales_count} prod.):* $${Math.round(p.sales_commission_amount).toLocaleString("es-AR")}\n` +
      (p.advances_deducted > 0
        ? `💸 *Adelantos descontados:* -$${Math.round(p.advances_deducted).toLocaleString("es-AR")}\n`
        : "") +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `✅ *TOTAL ABONADO: $${Math.round(p.total_paid).toLocaleString("es-AR")}*\n` +
      `💳 *Medio de pago:* ${p.payment_method}` +
      (p.reference_code ? ` (Ref: ${p.reference_code})` : "") +
      `\n📅 *Fecha de pago:* ${p.payment_date}\n\n` +
      `_Comprobante emitido automáticamente por el sistema de gestión._`;

    if (typeof window !== "undefined" && navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(p.id);
      setTimeout(() => setCopiedId(null), 2500);
      toast.success("Recibo copiado para WhatsApp");
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
            className="p-1.5 rounded-lg border border-white/10 bg-slate-950 text-xs text-white focus:border-[var(--accent)] outline-none"
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
          Total registros: <strong className="text-white">{payouts.length}</strong>
        </span>
      </div>

      {loading ? (
        <div className="p-8 rounded-2xl bg-slate-900/30 border border-white/5 text-center text-xs text-slate-400 animate-pulse">
          Cargando historial de liquidaciones...
        </div>
      ) : payouts.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900/20 border border-white/5 text-center space-y-2">
          <FileText className="w-8 h-8 text-slate-500 mx-auto" />
          <h4 className="text-sm font-bold text-white">No hay liquidaciones registradas</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Cuando abones comisiones a tus profesionales desde la tabla de resumen, quedarán registradas aquí con su recibo correspondiente.
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
                  <th className="py-3 px-4 text-center">Recibo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {payouts.map((p) => {
                  const isCopied = copiedId === p.id;
                  return (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[var(--accent)]">
                        #{p.id}
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
                            <ArrowRightLeft className="w-3 h-3 text-purple-400" />
                          )}
                          <span>{p.payment_method}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
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
              return (
                <div
                  key={p.id}
                  className="p-4 rounded-xl bg-slate-900/50 border border-white/10 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-0.5 rounded border border-[var(--accent)]/20">
                        #{p.id}
                      </span>
                      <span className="text-xs font-bold text-white">
                        {p.barbers?.name || "Profesional"}
                      </span>
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
                    <div>
                      <span>Fecha de pago: </span>
                      <strong className="text-slate-300">{p.payment_date}</strong> • {p.payment_method}
                    </div>
                    {p.advances_deducted > 0 && (
                      <div className="text-amber-400">
                        Adelantos descontados: -${Math.round(p.advances_deducted).toLocaleString("es-AR")}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => handleCopyWhatsApp(p)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
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
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
