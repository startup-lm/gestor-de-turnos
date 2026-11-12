"use client";

import React from "react";
import type { Appointment } from "@/lib/types/Appointment";
import { Receipt, CheckCircle2, Check, Copy } from "lucide-react";

interface AppointmentInvoiceSectionProps {
  hasInvoice: boolean;
  invoice: Appointment["arca_invoices"];
  invoiceId: number | null;
  copiedCae: boolean;
  onCopyCae: (text: string) => void;
}

export function AppointmentInvoiceSection({
  hasInvoice,
  invoice,
  invoiceId,
  copiedCae,
  onCopyCae,
}: AppointmentInvoiceSectionProps) {
  if (!hasInvoice || !invoice) return null;

  return (
    <div className="bg-[var(--background)]/60 border border-[var(--foreground)]/10 rounded-2xl p-4 md:p-5 space-y-3.5 shadow-inner">
      <div className="flex items-center justify-between pb-2.5 border-b border-[var(--foreground)]/10">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-emerald-400" />
          <h4 className="text-sm font-extrabold text-[var(--foreground)] tracking-tight">
            Comprobante emitido
          </h4>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
          {invoice.voucher_type === 6 ? "Factura B" : "Factura C"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
            Número
          </span>
          <span className="font-mono font-bold text-[var(--foreground)]">
            {invoice.point_of_sale != null && invoice.voucher_number != null
              ? `${String(invoice.point_of_sale).padStart(4, "0")}-${String(invoice.voucher_number).padStart(8, "0")}`
              : `#${invoiceId}`}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
            Estado fiscal
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            Aprobado
          </span>
        </div>

        <div className="col-span-2 bg-[var(--background)] rounded-xl p-3 border border-[var(--foreground)]/10 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Código CAE
            </span>
            {invoice.cae && (
              <button
                type="button"
                onClick={() => onCopyCae(invoice.cae!)}
                className="text-[11px] font-semibold text-[var(--accent)] hover:underline inline-flex items-center gap-1 cursor-pointer min-h-[44px] sm:min-h-0"
                aria-label="Copiar CAE"
              >
                {copiedCae ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar CAE</span>
                  </>
                )}
              </button>
            )}
          </div>
          <p className="font-mono text-sm font-bold text-emerald-400">
            {invoice.cae || "—"}
          </p>
          {invoice.cae_due_date && (
            <span className="text-[10px] text-slate-400 block">
              Vencimiento: {invoice.cae_due_date}
            </span>
          )}
        </div>

        {invoice.customer_name && (
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
              Receptor
            </span>
            <span className="font-medium text-[var(--foreground)] truncate block">
              {invoice.customer_name}
            </span>
          </div>
        )}

        {invoice.doc_number && (
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
              Documento
            </span>
            <span className="font-medium text-[var(--foreground)] truncate block">
              {invoice.doc_number}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
