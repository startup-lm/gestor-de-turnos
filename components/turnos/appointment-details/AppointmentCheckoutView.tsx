"use client";

import React from "react";
import type { Appointment } from "@/lib/types/Appointment";
import type { Barber } from "@/lib/types/Barbers";
import type { ArcaDocType } from "@/lib/types/Arca";
import ArcaDocFields from "@/components/arca/ArcaDocFields";
import { getPaymentMethodIcon } from "./utils";
import {
  ArrowLeft,
  X,
  FileText,
  DollarSign,
  Loader2,
} from "lucide-react";

interface AppointmentCheckoutViewProps {
  appointment: Appointment;
  currentService: { name: string } | null;
  client: string;
  currentBarber: Barber | null;
  formattedDate: string;
  checkoutPrice: number;
  setCheckoutPrice: (price: number) => void;
  availablePaymentMethods: string[];
  selectedPaymentMethod: string;
  setSelectedPaymentMethod: (method: string) => void;
  arcaAvailable: boolean;
  emitInvoice: boolean;
  setEmitInvoice: React.Dispatch<React.SetStateAction<boolean>>;
  docType: ArcaDocType;
  setDocType: (t: ArcaDocType) => void;
  docNumber: string;
  setDocNumber: (n: string) => void;
  receiverCondition: number;
  setReceiverCondition: (c: number) => void;
  checkoutLoading: boolean;
  onBack: () => void;
  onClose: () => void;
  onSubmit: (e?: React.FormEvent | React.MouseEvent) => void;
}

export function AppointmentCheckoutView({
  appointment,
  currentService,
  client,
  currentBarber,
  formattedDate,
  checkoutPrice,
  setCheckoutPrice,
  availablePaymentMethods,
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  arcaAvailable,
  emitInvoice,
  setEmitInvoice,
  docType,
  setDocType,
  docNumber,
  setDocNumber,
  receiverCondition,
  setReceiverCondition,
  checkoutLoading,
  onBack,
  onClose,
  onSubmit,
}: AppointmentCheckoutViewProps) {
  return (
    <div className="w-full bg-[var(--bg-carousel)] border border-[var(--foreground)]/10 rounded-3xl p-5 md:p-6 shadow-2xl flex flex-col h-fit max-h-full text-left overflow-y-auto gap-4">
      {/* BLOQUE SUPERIOR DE COBRO */}
      <div className="space-y-4">
        {/* Header de cobro con botón volver */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--foreground)]/10">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 rounded-full bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10 text-[var(--foreground)]/70 hover:text-[var(--foreground)] transition-colors"
              aria-label="Volver al detalle del turno"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] block">
                Registrar cobro
              </span>
              <h2 className="text-xl md:text-2xl font-black text-[var(--foreground)] tracking-tight">
                Turno #{appointment.id}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel"
            className="p-1.5 rounded-full bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10 text-[var(--foreground)]/60 hover:text-[var(--foreground)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mini resumen del turno */}
        <div className="bg-[var(--background)]/60 border border-[var(--foreground)]/10 rounded-2xl p-4 flex items-center justify-between shadow-inner">
          <div className="min-w-0">
            <span className="text-sm font-bold text-[var(--foreground)] block truncate">
              {currentService?.name || "Servicio"}
            </span>
            <span className="text-xs text-[var(--foreground)]/60 block truncate mt-0.5">
              {client || "Cliente"} · {currentBarber?.name || "Barbero"}
            </span>
          </div>
          <span className="text-xs font-bold text-[var(--accent)] shrink-0 bg-[var(--accent)]/10 px-2.5 py-1 rounded-lg border border-[var(--accent)]/20">
            {formattedDate}
          </span>
        </div>
      </div>

      {/* BLOQUE INFERIOR DE COBRO (FORMULARIO Y ACCIÓN) */}
      <form id="form-panel-checkout" onSubmit={onSubmit} className="space-y-4">
        <div className="bg-[var(--background)]/60 border border-[var(--foreground)]/10 rounded-2xl p-5 space-y-4 shadow-inner">
          {/* Monto a cobrar con padding forzado para no pisar el símbolo $ */}
          <div>
            <label
              htmlFor="paid-price"
              className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5"
            >
              Monto a cobrar ($)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--accent)] pointer-events-none">
                $
              </span>
              <input
                id="paid-price"
                type="number"
                min={0}
                required
                value={checkoutPrice}
                onChange={(e) => setCheckoutPrice(Number(e.target.value))}
                className="!bg-[var(--background)] !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-xl !py-3 !pr-4 !pl-9 w-full block text-sm font-bold shadow-inner"
              />
            </div>
          </div>

          {/* Métodos de pago configurados en admin */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
              Método de pago
            </label>

            {/* Botones visuales de medios de pago */}
            <div className="grid grid-cols-2 gap-2.5">
              {availablePaymentMethods.map((method) => {
                const isSelected = selectedPaymentMethod === method;
                const Icon = getPaymentMethodIcon(method);
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setSelectedPaymentMethod(method)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all text-xs font-semibold cursor-pointer ${
                      isSelected
                        ? "!bg-[var(--accent)]/15 !border-[var(--accent)] text-[var(--foreground)] shadow-sm shadow-[var(--accent)]/10"
                        : "!bg-[var(--background)] !border-[var(--foreground)]/10 text-[var(--foreground)]/70 hover:text-[var(--foreground)] hover:!border-[var(--foreground)]/20"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isSelected
                          ? "bg-[var(--accent)] text-slate-950"
                          : "bg-[var(--foreground)]/5 text-[var(--foreground)]/60"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="truncate">{method}</span>
                  </button>
                );
              })}
            </div>

            {/* Select oculto para accesibilidad / tests */}
            <select
              id="paid-payment-method"
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              className="sr-only"
              aria-label="Método de pago"
            >
              {availablePaymentMethods.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle ARCA (si está habilitado y configurado) */}
          {arcaAvailable && (
            <div className="border border-[var(--foreground)]/10 rounded-xl overflow-hidden bg-[var(--background)]/60">
              <button
                type="button"
                onClick={() => setEmitInvoice((v) => !v)}
                className={`!w-full !flex !items-center !justify-between !p-3 !text-xs !transition-all !border-0 !rounded-none !cursor-pointer ${
                  emitInvoice
                    ? "!bg-emerald-950/40 !border-b !border-emerald-500/25 text-emerald-300"
                    : "text-[var(--foreground)]/80 hover:bg-[var(--foreground)]/5"
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className={`w-4 h-4 ${emitInvoice ? "text-emerald-400" : "text-slate-400"}`} />
                  <span className="font-semibold">Emitir comprobante ARCA</span>
                </div>
                <div
                  className={`relative w-8 h-4 rounded-full transition-colors flex items-center p-0.5 ${
                    emitInvoice ? "!bg-emerald-500" : "!bg-slate-700"
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded-full bg-white shadow transition-transform ${
                      emitInvoice ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </div>
              </button>

              {emitInvoice && (
                <div className="p-3 space-y-2.5 bg-emerald-950/20 border-t border-emerald-500/20">
                  <ArcaDocFields
                    idPrefix="appointment"
                    docType={docType}
                    onDocTypeChange={setDocType}
                    docNumber={docNumber}
                    onDocNumberChange={setDocNumber}
                    receiverCondition={receiverCondition}
                    onReceiverConditionChange={setReceiverCondition}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Botón de confirmación de cobro al fondo */}
        <div className="pt-1">
          <button
            type="button"
            id="btn-paid-submit"
            onClick={onSubmit}
            disabled={checkoutLoading}
            className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all active:scale-95 text-sm cursor-pointer"
          >
            {checkoutLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <DollarSign className="w-5 h-5 stroke-[2.5]" />}
            <span>Confirmar cobro</span>
          </button>
        </div>
      </form>
    </div>
  );
}
