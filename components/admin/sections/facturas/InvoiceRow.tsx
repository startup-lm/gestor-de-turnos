"use client";

import { useState } from "react";
import { toast } from "@/lib/store/useToastStore";
import { verifyArcaInvoice } from "@/lib/repository/arca";
import type { ArcaInvoiceRecord } from "@/lib/types/Arca";
import { ActionButton } from "@/components/buttons/ActionButton";
import { STATUS_LABELS, DOC_TYPE_LABELS, SOURCE_LABELS } from "./constants";
import { ChevronDown, ChevronUp, FileText, RotateCcw, RefreshCw } from "lucide-react";

interface InvoiceRowProps {
  inv: ArcaInvoiceRecord;
  onVerified: () => void;
  onViewReceipt: (id: number) => void;
  onVoid: (inv: ArcaInvoiceRecord) => void;
}

export function InvoiceRow({
  inv,
  onVerified,
  onViewReceipt,
  onVoid,
}: InvoiceRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (verifying) return;
    setVerifying(true);
    try {
      const res = await verifyArcaInvoice(inv.id);
      if (res.success) {
        if (res.status === "approved") {
          toast.success("Factura confirmada en ARCA");
        } else {
          toast.info("La factura no se emitió. El cobro quedó libre para facturar");
        }
      } else {
        toast.error(res.error || "No se pudo verificar el comprobante con ARCA");
      }
      onVerified();
    } catch {
      toast.error("No se pudo verificar el comprobante con ARCA");
    } finally {
      setVerifying(false);
    }
  };

  const statusColor =
    inv.status === "approved"
      ? "bg-green-500/10 text-green-300 border-green-500/20"
      : inv.status === "voided"
      ? "bg-slate-500/15 text-slate-400 border-slate-500/30"
      : inv.status === "pending" || inv.status === "error"
      ? "bg-yellow-500/10 text-yellow-300 border-yellow-500/20"
      : "bg-red-500/10 text-red-300 border-red-500/20";

  const statusLabel = STATUS_LABELS[inv.status] ?? inv.status;
  const isType11 = (inv.voucher_type ?? inv.invoice_type) === 11;

  return (
    <>
      <tr
        className="border-b border-gray-800 hover:bg-white/2 cursor-pointer transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="py-2.5 pr-3 whitespace-nowrap text-xs">
          {inv.created_at ? new Date(inv.created_at).toLocaleDateString("es-AR") : "-"}
        </td>
        <td className="py-2.5 pr-3">
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${statusColor}`}>
            {statusLabel}
          </span>
        </td>
        <td className="py-2.5 pr-3 font-semibold text-[var(--accent)] whitespace-nowrap text-sm">
          ${Number(inv.total).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
        </td>
        <td className="py-2.5 pr-3 text-xs text-[var(--foreground)]/70 max-w-[120px] truncate">
          {inv.customer_name ?? "Cons. Final"}
        </td>
        <td className="py-2.5 pr-3 text-xs font-mono">
          {inv.cae ? (
            <span className="text-green-400">{inv.cae}</span>
          ) : (
            <span className="text-[var(--foreground)]/30">—</span>
          )}
        </td>
        <td className="py-2.5 pr-3 text-xs text-[var(--foreground)]/60">
          {inv.voucher_number != null ? (
            <span>#{String(inv.voucher_number).padStart(8, "0")}</span>
          ) : (
            "—"
          )}
        </td>
        <td className="py-2.5 pr-3 text-xs">
          {inv.source_type ? (
            <span className="px-1.5 py-0.5 rounded bg-[var(--foreground)]/8 text-[var(--foreground)]/70">
              {SOURCE_LABELS[inv.source_type] ?? inv.source_type}
            </span>
          ) : (
            <span className="text-[var(--foreground)]/30">—</span>
          )}
        </td>
        <td className="py-2.5 text-[var(--foreground)]/40 text-xs">
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </td>
      </tr>

      {expanded && (
        <tr className="border-b border-gray-800 bg-[var(--foreground)]/2">
          <td colSpan={8} className="px-4 py-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <p className="text-[var(--foreground)]/40 tracking-wider text-[10px] mb-0.5">Punto de venta</p>
                <p className="font-medium">{inv.point_of_sale ?? "—"}</p>
              </div>
              <div>
                <p className="text-[var(--foreground)]/40 tracking-wider text-[10px] mb-0.5">Tipo comprobante</p>
                <p className="font-medium">{inv.invoice_type ?? inv.voucher_type ?? "—"}</p>
              </div>
              <div>
                <p className="text-[var(--foreground)]/40 tracking-wider text-[10px] mb-0.5">Tipo documento</p>
                <p className="font-medium">
                  {inv.doc_type ? `${DOC_TYPE_LABELS[inv.doc_type] ?? inv.doc_type}` : "—"}
                </p>
              </div>
              <div>
                <p className="text-[var(--foreground)]/40 tracking-wider text-[10px] mb-0.5">Nro. documento</p>
                <p className="font-medium">{inv.doc_number ?? "—"}</p>
              </div>
              <div>
                <p className="text-[var(--foreground)]/40 tracking-wider text-[10px] mb-0.5">Vto. CAE</p>
                <p className="font-medium">{inv.cae_due_date ?? "—"}</p>
              </div>
              {inv.source_id && (
                <div>
                  <p className="text-[var(--foreground)]/40 tracking-wider text-[10px] mb-0.5">ID origen</p>
                  <p className="font-medium">#{inv.source_id}</p>
                </div>
              )}
            </div>
            {(inv.status === "approved" || inv.status === "voided") && inv.cae && (
              <div className="mt-3 flex flex-wrap items-center gap-2 pt-3 border-t border-[var(--foreground)]/10">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewReceipt(inv.id);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--foreground)]/20 hover:border-[var(--accent)]/50 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 hover:text-[var(--accent)] transition-all cursor-pointer min-h-[44px] sm:min-h-0"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Ver comprobante</span>
                </button>

                {inv.status === "approved" && isType11 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onVoid(inv);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 hover:border-rose-500/60 bg-rose-500/10 hover:bg-rose-500/20 text-xs font-semibold text-rose-300 hover:text-rose-200 transition-all cursor-pointer min-h-[44px] sm:min-h-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Anular con nota de crédito</span>
                  </button>
                )}
              </div>
            )}
            {(inv.status === "error" || inv.status === "pending") && (
              <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-xs text-yellow-300">
                  ARCA no respondió y puede haberla autorizado igual. Verificala antes de volver a facturar.
                </p>
                <ActionButton
                  name="Verificar en ARCA"
                  Icon={RefreshCw}
                  loading={verifying}
                  onClick={handleVerify}
                  className="min-h-[44px] shrink-0 text-xs"
                />
              </div>
            )}
            {inv.status === "rejected" && inv.error_message && (
              <p className="mt-3 text-xs text-red-300 break-words">
                Motivo: {inv.error_message}
              </p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
