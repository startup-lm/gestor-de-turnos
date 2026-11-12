"use client";

import React from "react";
import SendButton from "@/components/buttons/SendButton";
import ArcaDocFields from "@/components/arca/ArcaDocFields";
import type { ArcaDocType, ArcaStatus } from "@/lib/types/Arca";
import type { Appointment } from "@/lib/types/Appointment";
import type { ArcaPeriod } from "./constants";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Zap,
  Loader2,
  Receipt,
} from "lucide-react";

interface EmitInvoiceViewProps {
  isHomo?: boolean;
  certExpiryNotice: string | null;
  status: ArcaStatus | null;
  periodPreset: ArcaPeriod;
  setPeriodPreset: (p: ArcaPeriod) => void;
  customStart: string;
  setCustomStart: (s: string) => void;
  customEnd: string;
  setCustomEnd: (e: string) => void;
  daysCount: number;
  isPeriodValid: boolean;
  unbilledAppointments: Appointment[];
  unbilledTotal: number;
  batchBilling: boolean;
  confirmBatch: boolean;
  setConfirmBatch: (c: boolean) => void;
  onBatchInvoice: () => void;
  emitTotal: string;
  setEmitTotal: (t: string) => void;
  emitCustomerName: string;
  setEmitCustomerName: (n: string) => void;
  emitDocType: ArcaDocType;
  setEmitDocType: (t: ArcaDocType) => void;
  emitDocNumber: string;
  setEmitDocNumber: (n: string) => void;
  emitReceiverCondition: number;
  setEmitReceiverCondition: (c: number) => void;
  emitting: boolean;
  onEmit: (e: React.FormEvent) => void;
  onBack: () => void;
}

export function EmitInvoiceView({
  isHomo,
  certExpiryNotice,
  status,
  periodPreset,
  setPeriodPreset,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
  daysCount,
  isPeriodValid,
  unbilledAppointments,
  unbilledTotal,
  batchBilling,
  confirmBatch,
  setConfirmBatch,
  onBatchInvoice,
  emitTotal,
  setEmitTotal,
  emitCustomerName,
  setEmitCustomerName,
  emitDocType,
  setEmitDocType,
  emitDocNumber,
  setEmitDocNumber,
  emitReceiverCondition,
  setEmitReceiverCondition,
  emitting,
  onEmit,
  onBack,
}: EmitInvoiceViewProps) {
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
      {/* Cabecera con botón Volver arriba a la izquierda estilo estándar de /admin */}
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
            Emitir comprobante
          </h2>
          <p className="text-xs text-slate-400">
            Facturación en lote de turnos completados o emisión manual individual
          </p>
        </div>
      </div>

      {/* Alerta si ARCA no está listo */}
      {status && !status.ready && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs animate-in fade-in">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
          <span>
            Faltan datos de configuración en ARCA. Podés emitir en modo Demo o completar tus credenciales fiscales desde el menú lateral en <strong>Configuración ARCA</strong>.
          </span>
        </div>
      )}

      {/* ── Selector de Período para Turnos ──────────────────────── */}
      <div className="bg-[var(--foreground)]/5 p-4 rounded-2xl border border-[var(--foreground)]/10 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Calendar className="w-4 h-4 text-[var(--accent)]" />
            <span>Período de turnos a facturar:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(["daily", "weekly", "biweekly", "monthly", "custom"] as ArcaPeriod[]).map((p) => {
              const labels: Record<ArcaPeriod, string> = {
                daily: "Diario",
                weekly: "Semanal",
                biweekly: "Quincenal",
                monthly: "Mensual",
                custom: "Personalizado",
              };
              const isActive = periodPreset === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriodPreset(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? "!bg-[var(--accent)] !text-slate-950 font-bold shadow-sm"
                      : "!text-slate-400 hover:!text-white hover:!bg-white/5"
                  }`}
                >
                  {labels[p]}
                </button>
              );
            })}
          </div>
        </div>

        {periodPreset === "custom" && (
          <div className="pt-3 border-t border-[var(--foreground)]/10 flex flex-wrap items-center gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <label htmlFor="arca-emit-start" className="text-xs text-slate-400 font-medium">Desde:</label>
              <input
                id="arca-emit-start"
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="p-1.5 rounded-lg border border-[var(--foreground)]/15 bg-[var(--background)] text-xs text-[var(--foreground)] focus:border-[var(--accent)] outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="arca-emit-end" className="text-xs text-slate-400 font-medium">Hasta:</label>
              <input
                id="arca-emit-end"
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="p-1.5 rounded-lg border border-[var(--foreground)]/15 bg-[var(--background)] text-xs text-[var(--foreground)] focus:border-[var(--accent)] outline-none"
              />
            </div>

            <span className="text-xs text-slate-400">
              Duración: <strong className={daysCount > 31 ? "text-rose-400" : "text-emerald-400"}>{daysCount} días</strong>
            </span>
          </div>
        )}

        {!isPeriodValid && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>
              Por normativa de ARCA, el período a facturar no puede superar 31 días corridos. Por favor ajustá las fechas.
            </span>
          </div>
        )}
      </div>

      {/* ── Opción 1: Lote de Facturación de Turnos ───────────────── */}
      <section className="bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 rounded-2xl p-5 sm:p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-base mb-1">
              <Zap className="w-4 h-4 text-[var(--accent)]" />
              <span>Facturación en lote de turnos</span>
            </div>
            <p className="text-xs text-slate-400">
              {unbilledAppointments.length > 0 ? (
                <>
                  Hay <strong className="text-amber-400 font-bold">{unbilledAppointments.length} turnos</strong> pendientes de facturación en el período seleccionado por un total de{" "}
                  <strong className="text-emerald-400 font-bold">
                    ${unbilledTotal.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
                  </strong>.
                </>
              ) : (
                "Todos los turnos de este período ya fueron facturados o no presentan saldo pendiente."
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setConfirmBatch(true)}
            disabled={!status?.ready || batchBilling || unbilledAppointments.length === 0 || !isPeriodValid}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl !bg-[var(--accent)] hover:!bg-[var(--accent-hover)] !text-slate-950 font-bold text-xs transition-all cursor-pointer shadow-md shadow-[var(--accent)]/15 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap active:scale-95 self-start sm:self-auto min-h-[44px] sm:min-h-0"
          >
            {batchBilling ? (
              <Loader2 className="w-4 h-4 animate-spin text-inherit" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            <span>Facturar turnos pendientes</span>
          </button>
        </div>

        {confirmBatch && (
          <div className="mt-4 pt-4 border-t border-[var(--foreground)]/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-in fade-in duration-200">
            <p className="text-xs text-slate-200">
              Vas a emitir {unbilledAppointments.length} comprobantes por ${unbilledTotal.toLocaleString("es-AR", { minimumFractionDigits: 0 })}. ¿Confirmás?
            </p>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                disabled={batchBilling}
                onClick={() => setConfirmBatch(false)}
                className="px-3.5 py-1.5 rounded-xl border border-[var(--foreground)]/20 text-xs text-slate-300 hover:bg-white/5 font-medium transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] sm:min-h-0"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={batchBilling}
                onClick={onBatchInvoice}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-xl !bg-[var(--accent)] hover:!bg-[var(--accent-hover)] !text-slate-950 font-bold text-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] sm:min-h-0"
              >
                {batchBilling && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Sí, emitir</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── Opción 2: Emisión Manual Individual ───────────────────── */}
      <section className="bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 rounded-2xl p-5 sm:p-6 shadow-lg space-y-4">
        <div className="flex items-center gap-2 text-[var(--foreground)] font-bold text-base border-b border-[var(--foreground)]/10 pb-3">
          <Receipt className="w-4 h-4 text-[var(--accent)]" />
          <span>Emitir comprobante individual manual</span>
        </div>

        <form onSubmit={onEmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Monto total <span className="text-[var(--accent)]">*</span>
            </label>
            <input
              type="number"
              value={emitTotal}
              onChange={(e) => setEmitTotal(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-sm bg-transparent border-[var(--foreground)]/15 focus:border-[var(--accent)] outline-none"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Cliente (opcional)
            </label>
            <input
              value={emitCustomerName}
              onChange={(e) => setEmitCustomerName(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-sm bg-transparent border-[var(--foreground)]/15 focus:border-[var(--accent)] outline-none"
              placeholder="Consumidor final"
            />
          </div>

          <ArcaDocFields
            idPrefix="factura-emit"
            docType={emitDocType}
            onDocTypeChange={setEmitDocType}
            docNumber={emitDocNumber}
            onDocNumberChange={setEmitDocNumber}
            receiverCondition={emitReceiverCondition}
            onReceiverConditionChange={setEmitReceiverCondition}
            numberClassName="md:col-span-3"
          />

          <div className="md:col-span-3 flex justify-end pt-4 border-t border-white/5">
            <SendButton
              name="Emitir comprobante"
              type="submit"
              disabled={!status?.ready || emitting}
              loading={emitting}
              className="w-full sm:w-auto min-w-[200px]"
            />
          </div>
        </form>
      </section>
    </div>
  );
}
