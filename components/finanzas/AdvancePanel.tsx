"use client";

import React, { useState } from "react";
import { Barber } from "@/lib/types/Barbers";
import { createCashMovement } from "@/lib/repository/cash";
import { toast } from "@/lib/store/useToastStore";
import {
  HandCoins,
  Check,
  Banknote,
  ArrowRightLeft,
  ArrowLeft,
} from "lucide-react";

interface Props {
  barbers: Barber[];
  initialBarberId?: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdvancePanel({
  barbers,
  initialBarberId,
  onClose,
  onSuccess,
}: Readonly<Props>) {
  const [barberId, setBarberId] = useState<number>(initialBarberId || barbers[0]?.id || 0);
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("Efectivo");
  const [description, setDescription] = useState<string>("Adelanto de comisión");
  const [referenceCode, setReferenceCode] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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

      toast.success(`Adelanto de $${numAmount.toLocaleString("es-AR")} registrado correctamente`);
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
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2 text-xs font-semibold cursor-pointer"
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
                {b.name} ({b.role})
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
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod("Efectivo")}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2.5 text-xs font-bold transition-all cursor-pointer ${
                paymentMethod === "Efectivo"
                  ? "!bg-amber-500/15 !border-amber-500/40 !text-amber-300"
                  : "!bg-slate-950 !border-white/5 !text-slate-400 hover:!text-white"
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span>Efectivo de caja</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("Transferencia")}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2.5 text-xs font-bold transition-all cursor-pointer ${
                paymentMethod === "Transferencia"
                  ? "!bg-purple-500/15 !border-purple-500/40 !text-purple-300"
                  : "!bg-slate-950 !border-white/5 !text-slate-400 hover:!text-white"
              }`}
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Transferencia</span>
            </button>
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
        {paymentMethod === "Transferencia" && (
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
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl !bg-[var(--accent)] hover:!bg-[#E8CA8C] !text-slate-950 font-bold text-xs shadow-md shadow-[var(--accent)]/15 transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{isSubmitting ? "Registrando..." : "Guardar adelanto"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
