"use client";

import React from "react";
import InlineConfirm from "@/components/ui/InlineConfirm";
import type { Appointment } from "@/lib/types/Appointment";
import { DollarSign, CheckCircle, RotateCcw } from "lucide-react";

interface AppointmentPaymentStatusSectionProps {
  isPaid: boolean;
  isBlockedRange: boolean;
  loading: boolean;
  onOpenCheckout: (e?: React.MouseEvent) => void;
  paidInfo: { price: number; payment_method: string } | null;
  price: number;
  appointment: Appointment;
  arcaEnabled: boolean;
  invoiceId: number | null;
  confirmRevertPayment: boolean;
  setConfirmRevertPayment: (c: boolean) => void;
  reversingPayment: boolean;
  onRevertPayment: () => Promise<void>;
}

export function AppointmentPaymentStatusSection({
  isPaid,
  isBlockedRange,
  loading,
  onOpenCheckout,
  paidInfo,
  price,
  appointment,
  arcaEnabled,
  invoiceId,
  confirmRevertPayment,
  setConfirmRevertPayment,
  reversingPayment,
  onRevertPayment,
}: AppointmentPaymentStatusSectionProps) {
  return (
    <>
      {/* BOTÓN HERO: Cobrar turno si está pendiente */}
      {!isPaid && !isBlockedRange && (
        <div className="pt-0.5">
          <button
            type="button"
            id="btn-appt-charge"
            onClick={(e) => onOpenCheckout(e)}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all active:scale-95 text-sm cursor-pointer"
          >
            <DollarSign className="w-5 h-5 stroke-[2.5]" />
            <span>Cobrar turno</span>
          </button>
        </div>
      )}

      {/* Banner si ya está cobrado */}
      {isPaid && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
          <div className="flex items-center gap-2.5 text-emerald-400">
            <CheckCircle className="w-5 h-5" />
            <div>
              <span className="text-xs font-bold block leading-tight">Turno cobrado</span>
              <span className="text-[11px] text-emerald-400/80 font-medium">
                Monto registrado: ${(paidInfo?.price ?? price)?.toLocaleString("es-AR")}
                {(paidInfo?.payment_method || appointment.payment_method) ? ` · ${paidInfo?.payment_method || appointment.payment_method}` : ""}
              </span>
            </div>
          </div>
          {arcaEnabled && invoiceId && (
            <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-lg">
              Comprobante #{invoiceId}
            </span>
          )}
        </div>
      )}

      {/* Revertir cobro si está cobrado y no tiene comprobante */}
      {isPaid && !invoiceId && (
        <div className="space-y-2">
          {!confirmRevertPayment ? (
            <button
              type="button"
              id="btn-revert-payment"
              onClick={() => setConfirmRevertPayment(true)}
              className="w-full flex items-center justify-center gap-2 border border-amber-500/30 hover:border-amber-500/60 text-amber-400 hover:bg-amber-500/10 min-h-[44px] px-3.5 py-2.5 rounded-xl transition-all text-xs font-bold cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Revertir cobro</span>
            </button>
          ) : (
            <InlineConfirm
              message="¿Revertir el cobro de este turno?"
              confirmText="Sí, revertir"
              cancelText="No"
              loading={reversingPayment}
              onConfirm={onRevertPayment}
              onCancel={() => setConfirmRevertPayment(false)}
            />
          )}
        </div>
      )}
    </>
  );
}
