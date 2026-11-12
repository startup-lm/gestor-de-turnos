"use client";

import type { ArcaInvoiceRecord } from "@/lib/types/Arca";
import { todayInArgentina } from "@/lib/dates/argentina";
import { ArrowLeft, AlertTriangle, RotateCcw, Loader2 } from "lucide-react";

interface VoidInvoiceViewProps {
  voidingInvoice: ArcaInvoiceRecord;
  voidingLoading: boolean;
  onBack: () => void;
  onConfirmVoid: () => void;
}

export function VoidInvoiceView({
  voidingInvoice,
  voidingLoading,
  onBack,
  onConfirmVoid,
}: VoidInvoiceViewProps) {
  const isAppointment = voidingInvoice.source_type === "appointment";
  const isSale = voidingInvoice.source_type === "sale";
  const originLabel = isAppointment ? "el turno" : isSale ? "la venta" : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 w-full max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-5">
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-[var(--accent)] hover:text-white transition-colors cursor-pointer group mb-1"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Volver a comprobantes</span>
          </button>
          <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            Anular factura con nota de crédito
          </h2>
          <p className="text-xs text-slate-400">
            Confirmación de emisión oficial de Nota de crédito C ante ARCA
          </p>
        </div>
      </div>

      {/* Resumen del comprobante a anular */}
      <section className="bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 rounded-2xl p-5 sm:p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--foreground)]/10 pb-3">
          <div>
            <p className="text-xs text-slate-400">Factura a anular</p>
            <h3 className="text-base font-bold text-white">
              Factura C #{String(voidingInvoice.voucher_number ?? 0).padStart(8, "0")}
            </h3>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Monto total</p>
            <p className="text-lg font-mono font-bold text-rose-400">
              ${Number(voidingInvoice.total).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-slate-400 mb-0.5">Punto de venta</p>
            <p className="font-medium text-slate-200">{voidingInvoice.point_of_sale ?? "—"}</p>
          </div>
          <div>
            <p className="text-slate-400 mb-0.5">CAE original</p>
            <p className="font-medium text-slate-200 font-mono">{voidingInvoice.cae ?? "—"}</p>
          </div>
          <div>
            <p className="text-slate-400 mb-0.5">Cliente</p>
            <p className="font-medium text-slate-200">{voidingInvoice.customer_name || "Consumidor final"}</p>
          </div>
          <div>
            <p className="text-slate-400 mb-0.5">Fecha de emisión</p>
            <p className="font-medium text-slate-200">
              {voidingInvoice.voucher_date
                ? voidingInvoice.voucher_date
                : voidingInvoice.created_at
                ? todayInArgentina(new Date(voidingInvoice.created_at))
                : "—"}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs space-y-1.5">
          <p className="font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Efecto fiscal y en el sistema</span>
          </p>
          <p className="text-[11px] leading-relaxed opacity-90">
            Se emitirá una Nota de crédito C oficial por el total de ${Number(voidingInvoice.total).toLocaleString("es-AR", { minimumFractionDigits: 2 })} vinculada a esta factura.
            La factura original pasará a estado <strong>Anulada</strong>
            {originLabel ? ` y ${originLabel} quedará liberado para volver a facturarse cuando lo desees.` : "."}
          </p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-[var(--foreground)]/10">
          <button
            type="button"
            disabled={voidingLoading}
            onClick={onBack}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[var(--foreground)]/20 text-xs text-slate-300 hover:bg-white/5 font-semibold transition-all cursor-pointer disabled:opacity-40 min-h-[44px]"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={voidingLoading}
            onClick={onConfirmVoid}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl !bg-rose-500 hover:!bg-rose-600 !text-white font-bold text-xs shadow-md shadow-rose-500/20 transition-all cursor-pointer disabled:opacity-40 min-h-[44px]"
          >
            {voidingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            <span>Emitir nota de crédito</span>
          </button>
        </div>
      </section>
    </div>
  );
}
