"use client";

import React from "react";
import { format } from "date-fns";
import type { Appointment } from "@/lib/types/Appointment";
import { X, CheckCircle, Clock, Receipt } from "lucide-react";

interface AppointmentHeaderProps {
  appointment: Appointment;
  isBlockedRange: boolean;
  isPaid: boolean;
  arcaEnabled: boolean;
  invoiceId: number | null;
  onClose: () => void;
}

export function AppointmentHeader({
  appointment,
  isBlockedRange,
  isPaid,
  arcaEnabled,
  invoiceId,
  onClose,
}: AppointmentHeaderProps) {
  return (
    <>
      {/* Header con botón cerrar */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--foreground)]/10">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)] block">
            Detalle del turno
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <h3 className="text-xl md:text-2xl font-black text-[var(--foreground)] tracking-tight">
              Turno #{appointment.id}
            </h3>
            {isBlockedRange ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                <Clock className="w-3 h-3" />
                Bloqueo
              </span>
            ) : isPaid ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                <CheckCircle className="w-3 h-3" />
                Cobrado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                <Clock className="w-3 h-3" />
                Pendiente
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar panel de detalle"
          className="p-1.5 rounded-full bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10 text-[var(--foreground)]/60 hover:text-[var(--foreground)] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Metadatos (Actualización y ARCA) */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        {appointment.updated_at ? (
          <span className="text-[11px] text-[var(--foreground)]/50">
            Modificado: {format(new Date(appointment.updated_at), "dd/MM/yyyy HH:mm")}
          </span>
        ) : (
          <span className="text-[11px] text-[var(--foreground)]/50">
            Turno registrado
          </span>
        )}

        {arcaEnabled && invoiceId && (
          <div className="flex items-center gap-1 text-[11px] text-green-300 font-medium px-2.5 py-0.5 bg-green-500/10 border border-green-500/20 rounded-full">
            <Receipt className="w-3 h-3 text-green-400 shrink-0" />
            <span>Comprobante emitido</span>
          </div>
        )}
      </div>
    </>
  );
}
