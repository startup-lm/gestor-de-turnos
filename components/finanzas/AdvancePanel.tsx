"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Barber } from "@/lib/types/Barbers";
import { createCashMovement } from "@/lib/repository/cash";
import { useBusinessContext } from "@/lib/context/BusinessContext";
import { DEFAULT_PAYMENT_METHODS } from "@/lib/flags";
import { toast } from "@/lib/store/useToastStore";
import { formatARS } from "@/lib/format/currency";
import { roleLabel } from "@/lib/format/roles";
import {
  HandCoins,
  Check,
  Banknote,
  ArrowRightLeft,
  CreditCard,
  Wallet,
  ArrowLeft,
  Loader2,
} from "lucide-react";

interface Props {
  barbers: Barber[];
  initialBarberId?: number;
  onClose: () => void;
  onSuccess: () => void;
}

const getMethodIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes("efectivo")) return Banknote;
  if (lower.includes("transf")) return ArrowRightLeft;
  if (
    lower.includes("débito") ||
    lower.includes("debito") ||
    lower.includes("crédito") ||
    lower.includes("credito") ||
    lower.includes("tarjeta")
  ) {
    return CreditCard;
  }
  return Wallet;
};

export default function AdvancePanel({
  barbers,
  initialBarberId,
  onClose,
  onSuccess,
}: Readonly<Props>) {
  const { businessSettings } = useBusinessContext();
  const paymentMethods = useMemo(
    () =>
      businessSettings?.payment_methods?.length
        ? businessSettings.payment_methods
        : DEFAULT_PAYMENT_METHODS,
    [businessSettings?.payment_methods]
  );

  const [barberId, setBarberId] = useState<number>(initialBarberId || barbers[0]?.id || 0);
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>(
    () => paymentMethods[0] || "Efectivo"
  );
  const [description, setDescription] = useState<string>("Adelanto de comisión");
  const [referenceCode, setReferenceCode] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (paymentMethods.length > 0 && !paymentMethods.includes(paymentMethod)) {
      setPaymentMethod(paymentMethods[0]);
    }
  }, [paymentMethods, paymentMethod]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error("Ingresá un importe válido mayor a 0");
      return;
    }
    if (!barberId) {
      toast.error("Seleccioná un profesional");
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedBarber = barbers.find((b) => b.id === barberId);
      const res = await createCashMovement({
        type: "advance",
        category: "adelanto",
        barber_id: barberId,
        amount: numAmount,
        payment_method: paymentMethod,
        description: description.trim() || `Adelanto a ${selectedBarber?.name || "profesional"}`,
        reference_code: referenceCode.trim() || undefined,
        created_by: "admin",
      });

      if (!res.success) {
        toast.error(res.error || "No se pudo registrar el adelanto");
        return;
      }

      toast.success(`Adelanto de ${formatARS(numAmount)} registrado correctamente`);
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error("Error al registrar el adelanto");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 w-full max-w-2xl mx-auto">
      {/* Cabecera con botón de retorno */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2 text-xs font-semibold cursor-pointer min-h-[44px] sm:min-h-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <HandCoins className="w-5 h-5 text-amber-400" />
              <span>Registrar adelanto a profesional</span>
            </h3>
            <p className="text-xs text-slate-400">
              Se deducirá automáticamente en su próxima liquidación de comisiones
            </p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="dashboard-card p-6 space-y-5 border border-white/10 bg-slate-900/60">
        {/* Profesional */}
        <div className="space-y-1.5">
          <label htmlFor="advance-barber-select" className="block text-xs font-semibold text-slate-300">
            Profesional que recibe el adelanto
          </label>
          <select
            id="advance-barber-select"
            value={barberId}
            onChange={(e) => setBarberId(Number(e.target.value))}
            className="w-full p-3 rounded-xl border border-white/10 bg-slate-950 text-sm text-white focus:border-[var(--accent)] outline-none"
          >
            {barbers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({roleLabel(b.role)})
              </option>
            ))}
          </select>
        </div>

        {/* Importe */}
        <div className="space-y-1.5">
          <label htmlFor="advance-amount-input" className="block text-xs font-semibold text-slate-300">
            Importe a entregar ($)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
              $
            </span>
            <input
              id="advance-amount-input"
              type="number"
              min="1"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="10000"
              required
              className="w-full pl-9 pr-3.5 py-3 rounded-xl border border-white/10 bg-slate-950 text-base font-bold text-white focus:border-[var(--accent)] outline-none"
            />
          </div>
        </div>

        {/* Medio de entrega */}
        <div className="space-y-1.5">
          <span className="block text-xs font-semibold text-slate-300">
            Medio de entrega
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {paymentMethods.map((m) => {
              const Icon = getMethodIcon(m);
              const isSelected = paymentMethod === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer min-h-[44px] sm:min-h-0 ${
                    isSelected
                      ? "!bg-amber-500/15 !border-amber-500/40 !text-amber-300 shadow-sm"
                      : "!bg-slate-950 !border-white/5 !text-slate-400 hover:!text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{m}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Concepto / Descripción */}
        <div className="space-y-1.5">
          <label htmlFor="advance-desc-input" className="block text-xs font-semibold text-slate-300">
            Concepto
          </label>
          <input
            id="advance-desc-input"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej: Adelanto semanal"
            className="w-full p-3 rounded-xl border border-white/10 bg-slate-950 text-xs text-white focus:border-[var(--accent)] outline-none"
          />
        </div>

        {/* Referencia opcional */}
        {paymentMethod !== "Efectivo" && (
          <div className="space-y-1.5">
            <label htmlFor="advance-ref-input" className="block text-xs font-semibold text-slate-300">
              Nº de operación o comprobante (opcional)
            </label>
            <input
              id="advance-ref-input"
              type="text"
              value={referenceCode}
              onChange={(e) => setReferenceCode(e.target.value)}
              placeholder="Ej: Op #91823"
              className="w-full p-3 rounded-xl border border-white/10 bg-slate-950 text-xs text-white focus:border-[var(--accent)] outline-none"
            />
          </div>
        )}

        {/* Acciones del formulario */}
        <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer min-h-[44px] sm:min-h-0"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl !bg-[var(--accent)] hover:opacity-90 !text-slate-950 font-bold text-xs shadow-md shadow-[var(--accent)]/15 transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50 disabled:scale-100 flex items-center gap-2 min-h-[44px] sm:min-h-0"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
            ) : (
              <Check className="w-4 h-4 stroke-[3]" />
            )}
            <span>Guardar adelanto</span>
          </button>
        </div>
      </form>
    </div>
  );
}
