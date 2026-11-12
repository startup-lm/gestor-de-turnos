"use client";

import React from "react";
import { Download, Filter } from "lucide-react";
import type { ArcaInvoiceRecord } from "@/lib/types/Arca";
import { exportToCsv } from "./utils";
import { InvoiceRow } from "./InvoiceRow";

interface InvoiceTableProps {
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

export function InvoiceTable({
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
}: InvoiceTableProps) {
  const hasActiveFilters = !!(filterStatus || filterSource);

  return (
    <section className="bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 rounded-2xl p-5 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-[var(--foreground)]">Historial de facturas</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Comprobantes registrados en ARCA para el período seleccionado
          </p>
        </div>
        <div className="flex items-center gap-2">
          {invoices.length > 0 && (
            <button
              type="button"
              onClick={() => exportToCsv(invoices)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg !border !border-[var(--foreground)]/20 hover:!border-[var(--accent)]/50 !bg-white/5 !text-slate-200 hover:!text-[var(--accent)] transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar CSV
            </button>
          )}

          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg !border transition-colors cursor-pointer ${
              hasActiveFilters
                ? "!border-[var(--accent)]/50 !text-[var(--accent)] !bg-[var(--accent)]/10 font-bold"
                : "!border-[var(--foreground)]/20 !text-slate-200 !bg-white/5 hover:!border-[var(--accent)]/50 hover:!text-[var(--accent)]"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filtros{hasActiveFilters ? " (activos)" : ""}
          </button>
        </div>
      </div>

      {/* Panel de filtros colapsable */}
      {filtersOpen && (
        <div className="grid grid-cols-2 md:grid-cols-2 gap-3 mb-4 p-3 bg-[var(--foreground)]/3 rounded-xl border border-[var(--foreground)]/10 text-sm animate-in fade-in">
          <div>
            <label className="block text-xs text-[var(--foreground)]/50 mb-1">Estado</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full border rounded-lg px-2 py-1.5 text-xs bg-transparent border-[var(--foreground)]/15"
            >
              <option value="">Todos</option>
              <option value="approved">Aprobado</option>
              <option value="rejected">Rechazado</option>
              <option value="error">Sin respuesta</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-[var(--foreground)]/50 mb-1">Origen</label>
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="w-full border rounded-lg px-2 py-1.5 text-xs bg-transparent border-[var(--foreground)]/15"
            >
              <option value="">Todos</option>
              <option value="appointment">Turnos</option>
              <option value="sale">Ventas</option>
              <option value="manual">Manual</option>
            </select>
          </div>
          {hasActiveFilters && (
            <div className="col-span-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setFilterStatus("");
                  setFilterSource("");
                }}
                className="text-xs !bg-transparent !text-slate-400 hover:!text-red-400 transition-colors cursor-pointer underline underline-offset-2"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      )}

      {loadingInvoices && (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      )}

      {!loadingInvoices && invoices.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-6">
          {hasActiveFilters
            ? "No hay comprobantes con los filtros seleccionados."
            : "No hay comprobantes registrados en este período."}
        </p>
      )}

      {invoices.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs md:text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-left text-[var(--foreground)]/50 text-[11px] tracking-wider">
                <th className="py-2 pr-3">Fecha</th>
                <th className="py-2 pr-3">Estado</th>
                <th className="py-2 pr-3">Total</th>
                <th className="py-2 pr-3">Cliente</th>
                <th className="py-2 pr-3">CAE</th>
                <th className="py-2 pr-3">Nro.</th>
                <th className="py-2 pr-3">Origen</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <InvoiceRow
                  key={inv.id}
                  inv={inv}
                  onVerified={onVerified}
                  onViewReceipt={onViewReceipt}
                  onVoid={onVoid}
                />
              ))}
            </tbody>
          </table>
          <p className="text-xs text-[var(--foreground)]/30 mt-3 text-right">
            {invoices.length} comprobante{invoices.length !== 1 ? "s" : ""}
            {hasActiveFilters ? " (filtrados)" : ""}
          </p>
        </div>
      )}
    </section>
  );
}
