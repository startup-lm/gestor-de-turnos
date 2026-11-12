"use client";

import React from "react";
import { Receipt, AlertTriangle, Clock, Plus } from "lucide-react";
import type { ArcaInvoiceRecord, ArcaStatus } from "@/lib/types/Arca";
import { ENV_LABELS, type ArcaPeriod } from "./constants";
import { MetricCard } from "./MetricCard";
import { InvoicePeriodSelector } from "./InvoicePeriodSelector";
import { InvoiceTable } from "./InvoiceTable";

interface InvoiceListViewProps {
  isHomo?: boolean;
  certExpiryNotice: string | null;
  status: ArcaStatus | null;
  onEmitClick: () => void;
  periodPreset: ArcaPeriod;
  setPeriodPreset: (p: ArcaPeriod) => void;
  customStart: string;
  setCustomStart: (s: string) => void;
  customEnd: string;
  setCustomEnd: (e: string) => void;
  daysCount: number;
  isPeriodValid: boolean;
  periodInvoicesTotal: number;
  approvedType11InvoicesCount: number;
  unbilledTotal: number;
  unbilledAppointmentsCount: number;
  invoices: ArcaInvoiceRecord[];
  loadingInvoices: boolean;
  filterStatus: string;
  setFilterStatus: (s: string) => void;
  filterSource: string;
  setFilterSource: (s: string) => void;
  filtersOpen: boolean;
  setFiltersOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onVerified: () => void;
  onViewReceipt: (id: number) => void;
  onVoid: (inv: ArcaInvoiceRecord) => void;
}

export function InvoiceListView({
  isHomo,
  certExpiryNotice,
  status,
  onEmitClick,
  periodPreset,
  setPeriodPreset,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
  daysCount,
  isPeriodValid,
  periodInvoicesTotal,
  approvedType11InvoicesCount,
  unbilledTotal,
  unbilledAppointmentsCount,
  invoices,
  loadingInvoices,
  filterStatus,
  setFilterStatus,
  filterSource,
  setFilterSource,
  filtersOpen,
  setFiltersOpen,
  onVerified,
  onViewReceipt,
  onVoid,
}: InvoiceListViewProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300 w-full">
      {isHomo && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-medium">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
          <span>Homologación: los comprobantes son de prueba en ARCA y no tienen validez fiscal.</span>
        </div>
      )}
      {certExpiryNotice && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-medium">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
          <span>{certExpiryNotice}</span>
        </div>
      )}
      {/* Cabecera Estilo Ventas */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
              Comprobantes
            </h2>
            {status?.environment && (
              <span
                className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-md border ${
                  status.environment === "prod"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : status.environment === "homo"
                    ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                    : "bg-amber-500/10 text-amber-300 border-amber-500/20"
                }`}
              >
                {ENV_LABELS[status.environment]}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Historial y registro de facturación electrónica ARCA con CAE
          </p>
        </div>
        <button
          type="button"
          onClick={onEmitClick}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl !bg-[var(--accent)] hover:!bg-[var(--accent-hover)] !text-slate-950 font-bold text-sm shadow-md shadow-[var(--accent)]/15 transition-all hover:scale-105 active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Emitir factura</span>
        </button>
      </div>

      {/* ── Selector de Período ARCA ───────────────────────────────── */}
      <InvoicePeriodSelector
        periodPreset={periodPreset}
        setPeriodPreset={setPeriodPreset}
        customStart={customStart}
        setCustomStart={setCustomStart}
        customEnd={customEnd}
        setCustomEnd={setCustomEnd}
        daysCount={daysCount}
        isPeriodValid={isPeriodValid}
      />

      {/* ── Métricas del Período (2 Tarjetas Claras de Negocio) ──────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MetricCard
          label="Facturado en el período"
          value={`$${periodInvoicesTotal.toLocaleString("es-AR", { minimumFractionDigits: 0 })}`}
          sub={`${approvedType11InvoicesCount} factura${approvedType11InvoicesCount !== 1 ? "s" : ""}`}
          icon={Receipt}
          color="accent"
        />
        <MetricCard
          label="Pendiente de facturar"
          value={`$${unbilledTotal.toLocaleString("es-AR", { minimumFractionDigits: 0 })}`}
          sub={`${unbilledAppointmentsCount} turno${unbilledAppointmentsCount !== 1 ? "s" : ""} sin factura`}
          icon={Clock}
          color={unbilledAppointmentsCount > 0 ? "yellow" : "green"}
        />
      </div>

      {/* ── Tabla de Comprobantes Emitidos ──────────────────────────── */}
      <InvoiceTable
        invoices={invoices}
        loadingInvoices={loadingInvoices}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterSource={filterSource}
        setFilterSource={setFilterSource}
        filtersOpen={filtersOpen}
        setFiltersOpen={setFiltersOpen}
        onVerified={onVerified}
        onViewReceipt={onViewReceipt}
        onVoid={onVoid}
      />
    </div>
  );
}
