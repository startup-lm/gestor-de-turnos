"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Printer, Loader2, AlertCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { getInvoiceReceipt } from "@/lib/repository/arca";
import { todayInArgentina } from "@/lib/dates/argentina";
import type { ArcaReceiptData } from "@/lib/types/Arca";

interface InvoiceReceiptProps {
  invoiceId: number;
  onBack: () => void;
}

const DOC_LABELS: Record<number, string> = {
  80: "CUIT",
  86: "CUIL",
  96: "DNI",
  99: "Consumidor Final",
};

const IVA_LABELS: Record<number, string> = {
  1: "IVA Responsable Inscripto",
  4: "IVA Sujeto Exento",
  5: "Consumidor Final",
  6: "Responsable Monotributo",
};

function formatDate(isoOrDate?: string | null): string {
  if (!isoOrDate) return "—";
  const str = isoOrDate.slice(0, 10);
  const parts = str.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return str;
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function InvoiceReceipt({ invoiceId, onBack }: InvoiceReceiptProps) {
  const [data, setData] = useState<ArcaReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    getInvoiceReceipt(invoiceId)
      .then((res) => {
        if (active) setData(res);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Error al cargar comprobante");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [invoiceId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="w-full space-y-6 animate-in fade-in duration-300">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-[var(--accent)] hover:text-white transition-colors cursor-pointer group mb-4 no-print"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Volver a comprobantes</span>
        </button>
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
          <p className="text-sm">Cargando comprobante fiscal...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full space-y-6 animate-in fade-in duration-300">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-[var(--accent)] hover:text-white transition-colors cursor-pointer group mb-4 no-print"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Volver a comprobantes</span>
        </button>
        <div className="flex flex-col items-center justify-center min-h-[250px] gap-3 text-rose-400 p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 max-w-lg mx-auto">
          <AlertCircle className="w-8 h-8" />
          <p className="text-sm font-medium text-center">{error || "No se encontró el comprobante"}</p>
          <button
            type="button"
            onClick={onBack}
            className="mt-2 px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/15 transition-colors cursor-pointer"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  const { invoice, issuer, qrUrl } = data;
  const isCreditNote = (invoice.voucher_type ?? invoice.invoice_type) === 13;
  const voucherTitle = isCreditNote ? "Nota de crédito C" : "Factura C";
  const voucherCode = isCreditNote ? "COD. 013" : "COD. 011";
  const ptoVta = String(invoice.point_of_sale ?? issuer.pointOfSale ?? 1).padStart(5, "0");
  const compNro = String(invoice.voucher_number ?? 0).padStart(8, "0");
  const rawIssueDate = invoice.voucher_date
    ? invoice.voucher_date.slice(0, 10)
    : invoice.created_at
    ? todayInArgentina(new Date(invoice.created_at))
    : null;
  const issueDate = formatDate(rawIssueDate);
  const caeDueDate = formatDate(invoice.cae_due_date);
  const docType = Number(invoice.doc_type ?? 99);
  const docLabel = DOC_LABELS[docType] ?? "Documento";
  const ivaCondition = invoice.receiver_iva_condition
    ? IVA_LABELS[invoice.receiver_iva_condition] ?? "Consumidor Final"
    : "Consumidor Final";

  return (
    <div className="space-y-6 animate-in fade-in duration-300 w-full max-w-4xl mx-auto">
      {/* ── Barra de Acciones Superior (no se imprime) ──────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/60 no-print">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-[var(--accent)] hover:text-white transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Volver a comprobantes</span>
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl !bg-[var(--accent)] hover:!bg-[var(--accent-hover)] !text-slate-950 font-bold text-xs shadow-md shadow-[var(--accent)]/15 transition-all cursor-pointer min-h-[44px] sm:min-h-0 self-start sm:self-auto"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimir comprobante</span>
        </button>
      </div>

      {/* ── Comprobante Oficial (Área de Impresión) ───────────────────── */}
      <div className="print-area bg-white text-slate-900 rounded-2xl shadow-xl p-5 sm:p-8 border border-slate-200">
        {invoice.status === "voided" && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-300 text-rose-700 text-xs font-bold text-center tracking-wider uppercase">
            Comprobante anulado mediante nota de crédito
          </div>
        )}

        {/* Encabezado: Emisor a la izquierda, Código central, Datos del comprobante a la derecha */}
        <div className="relative border-b-2 border-slate-900 pb-5 mb-5">
          {/* Cuadro central con la letra C */}
          <div className="sm:absolute sm:left-1/2 sm:-translate-x-1/2 sm:top-0 flex flex-col items-center justify-center mb-4 sm:mb-0">
            <div className="w-14 h-14 border-2 border-slate-900 rounded-lg flex flex-col items-center justify-center bg-white">
              <span className="text-2xl font-black leading-none">C</span>
              <span className="text-[9px] font-bold tracking-tight text-slate-700">{voucherCode}</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mt-1">ORIGINAL</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {/* Lado izquierdo: Datos del Emisor */}
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                {issuer.legalName || "Emisor no configurado"}
              </h1>
              <p className="text-xs text-slate-700">
                <strong>Domicilio comercial:</strong> {issuer.fiscalAddress || "—"}
              </p>
              <p className="text-xs text-slate-700">
                <strong>Condición frente al IVA:</strong> {issuer.taxCondition}
              </p>
            </div>

            {/* Lado derecho: Datos del Comprobante */}
            <div className="space-y-1 sm:text-right">
              <h2 className="text-lg sm:text-xl font-black text-slate-950 uppercase tracking-tight">
                {voucherTitle}
              </h2>
              <p className="text-xs font-mono font-bold text-slate-900">
                Punto de venta: {ptoVta} &nbsp; Comp. Nro: {compNro}
              </p>
              <p className="text-xs text-slate-700">
                <strong>Fecha de emisión:</strong> {issueDate}
              </p>
              <p className="text-xs text-slate-700">
                <strong>CUIT:</strong> {issuer.cuit || "—"}
              </p>
              <p className="text-xs text-slate-700">
                <strong>Ingresos brutos:</strong> {issuer.grossIncome || "—"}
              </p>
              <p className="text-xs text-slate-700">
                <strong>Inicio de actividades:</strong> {formatDate(issuer.activityStartDate)}
              </p>
            </div>
          </div>
        </div>

        {/* Datos del Receptor */}
        <div className="border border-slate-300 rounded-xl p-4 mb-5 text-xs bg-slate-50/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <p className="text-slate-600 mb-0.5">Receptor</p>
            <p className="font-bold text-slate-900 text-sm">{invoice.customer_name || "Consumidor final"}</p>
            <p className="text-slate-700 mt-1">
              <strong>Condición frente al IVA:</strong> {ivaCondition}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-slate-600 mb-0.5">Identificación</p>
            <p className="font-bold text-slate-900 text-sm">
              {docType === 99 ? "Consumidor final" : `${docLabel}: ${invoice.doc_number || "—"}`}
            </p>
            {invoice.credit_note_of_id && (
              <p className="text-slate-700 mt-1 font-mono">
                <strong>Comprobante asociado:</strong> Factura C #{invoice.credit_note_of_id}
              </p>
            )}
          </div>
        </div>

        {/* Tabla de Conceptos / Detalle */}
        <div className="border border-slate-300 rounded-xl overflow-hidden mb-6">
          <table className="w-full text-xs">
            <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-4 text-left">Descripción</th>
                <th className="py-2.5 px-4 text-center w-24">Cantidad</th>
                <th className="py-2.5 px-4 text-right w-32">Precio unitario</th>
                <th className="py-2.5 px-4 text-right w-32">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="py-3 px-4 text-slate-900">
                  <span className="font-semibold">
                    {isCreditNote ? "Anulación de servicios / venta" : "Servicios profesionales de barbería / estética"}
                  </span>
                  {invoice.source_type && (
                    <span className="block text-[11px] text-slate-500 mt-0.5">
                      Origen: {invoice.source_type === "appointment" ? "Turno" : invoice.source_type === "sale" ? "Venta" : "Manual"}
                      {invoice.source_id ? ` #${invoice.source_id}` : ""}
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-center font-mono">1</td>
                <td className="py-3 px-4 text-right font-mono">${formatCurrency(Number(invoice.total))}</td>
                <td className="py-3 px-4 text-right font-mono font-bold">${formatCurrency(Number(invoice.total))}</td>
              </tr>
            </tbody>
            <tfoot className="bg-slate-50 border-t-2 border-slate-900">
              <tr>
                <td colSpan={3} className="py-3 px-4 text-right font-black uppercase text-slate-900 text-sm">
                  Importe total:
                </td>
                <td className="py-3 px-4 text-right font-black text-slate-950 font-mono text-base">
                  ${formatCurrency(Number(invoice.total))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Pie: CAE, Vencimiento y Código QR Oficial */}
        <div className="border-t-2 border-slate-900 pt-5 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-2 border border-slate-300 rounded-xl bg-white shrink-0 shadow-sm">
              <QRCodeSVG value={qrUrl} size={110} level="M" />
            </div>
            <div className="text-xs text-slate-700 space-y-1">
              <p className="font-extrabold text-slate-950 text-sm tracking-tight">ARCA — Factura electrónica</p>
              <p className="text-[11px] text-slate-500">
                Comprobante electrónico autorizado con código de autorización digital.
              </p>
              <p className="text-[10px] text-slate-400 break-all">
                Escaneá el código QR para verificar la validez oficial en ARCA.
              </p>
            </div>
          </div>

          <div className="sm:text-right space-y-1 shrink-0 bg-slate-50 p-4 rounded-xl border border-slate-200 min-w-[220px]">
            <p className="text-xs text-slate-600">
              <strong className="text-slate-900">CAE N°:</strong>{" "}
              <span className="font-mono font-extrabold text-slate-950 text-sm">{invoice.cae || "—"}</span>
            </p>
            <p className="text-xs text-slate-600">
              <strong className="text-slate-900">Fecha de vto. de CAE:</strong>{" "}
              <span className="font-mono font-bold text-slate-900">{caeDueDate}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
