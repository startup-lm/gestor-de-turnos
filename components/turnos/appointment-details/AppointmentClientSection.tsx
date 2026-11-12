"use client";

import React from "react";
import ClientAutocompleteFields from "../ClientAutocompleteFields";
import { User, MessageCircle } from "lucide-react";

interface AppointmentClientSectionProps {
  isBlockedRange: boolean;
  client: string;
  setClient: (c: string) => void;
  phone: string;
  setPhone: (p: string) => void;
  isLocked: boolean;
  whatsappUrl: string | null;
  isPaid: boolean;
  paidInfo: { price: number; payment_method: string } | null;
  price: number;
  setPrice: (p: number) => void;
}

export function AppointmentClientSection({
  isBlockedRange,
  client,
  setClient,
  phone,
  setPhone,
  isLocked,
  whatsappUrl,
  isPaid,
  paidInfo,
  price,
  setPrice,
}: AppointmentClientSectionProps) {
  return (
    <div className="bg-[var(--background)]/60 border border-[var(--foreground)]/10 rounded-2xl p-4 md:p-5 space-y-3.5 shadow-inner">
      <div className="flex items-center justify-between pb-2.5 border-b border-[var(--foreground)]/10">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] block">
            Gestión
          </span>
          <h4 className="text-base font-extrabold text-[var(--foreground)] tracking-tight">
            {isBlockedRange ? "Motivo de bloqueo" : "Datos del cliente"}
          </h4>
        </div>
        <User className="w-5 h-5 text-[var(--accent)]/70" />
      </div>

      {isBlockedRange ? (
        <div>
          <label
            htmlFor="appt-blocked-reason"
            className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5"
          >
            Motivo
          </label>
          <input
            id="appt-blocked-reason"
            type="text"
            value={client}
            onChange={(e) => setClient(e.target.value)}
            placeholder="Ej: Almuerzo, feriado, descanso"
            className="!bg-[var(--background)] !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-xl p-2.5 w-full block text-sm shadow-inner"
          />
        </div>
      ) : (
        <div className="space-y-3.5">
          <ClientAutocompleteFields
            name={client}
            phone={phone}
            onNameChange={setClient}
            onPhoneChange={setPhone}
            onClientResolved={() => {}}
            disabled={isLocked}
            phoneSuffix={
              whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] min-w-[44px] px-3.5 py-2 inline-flex items-center justify-center gap-1.5 rounded-xl bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 text-xs font-semibold transition-all cursor-pointer"
                  title="Abrir chat de WhatsApp"
                  aria-label="Abrir chat de WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>
              ) : null
            }
          />

          {/* Si ya está pagado, campo de monto cobrado con padding forzado */}
          {isPaid && (
            <div className="pt-2 border-t border-[var(--foreground)]/10">
              <label
                htmlFor="appt-price"
                className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5"
              >
                Monto cobrado ($)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--accent)] pointer-events-none">
                  $
                </span>
                <input
                  id="appt-price"
                  type="number"
                  disabled={isLocked}
                  value={paidInfo?.price ?? price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className={`!bg-[var(--background)] !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-xl !py-2.5 !pr-3 !pl-8 w-full block text-xs shadow-inner font-bold ${
                    isLocked ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
