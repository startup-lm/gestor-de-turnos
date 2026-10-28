"use client";

import React, { useState } from "react";
import { createCashMovement } from "@/lib/repository/cash";
import { toast } from "@/lib/store/useToastStore";
import {
  TrendingDown,
  Check,
  Banknote,
  CreditCard,
  ArrowRightLeft,
  Wallet,
  ArrowLeft,
} from "lucide-react";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  { id: "insumos", label: "Insumos y productos de uso" },
  { id: "servicios", label: "Servicios (Luz, Agua, Internet, Gas)" },
  { id: "alquiler", label: "Alquiler del local" },
  { id: "limpieza", label: "Limpieza y desinfección" },
  { id: "mantenimiento", label: "Mantenimiento y reparaciones" },
  { id: "retiro_dueno", label: "Retiro de dueño / ganancia" },
  { id: "otro", label: "Otros gastos generales" },
];

const METHODS = [
  { name: "Efectivo", icon: Banknote },
  { name: "Transferencia", icon: ArrowRightLeft },
  { name: "Tarjeta de débito", icon: CreditCard },
  { name: "Mercado Pago", icon: Wallet },
];

export default function ExpensePanel({ onClose, onSuccess }: Readonly<Props>) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("insumos");
  const [paymentMethod, setPaymentMethod] = useState("Efectivo");
  const [referenceCode, setReferenceCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error("Ingresá un importe válido mayor a 0");
      return;
    }
    if (!description.trim()) {
      toast.error("Ingresá una descripción o concepto del gasto");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createCashMovement({
        type: "expense",
        category,
        amount: numAmount,
        payment_method: paymentMethod,
        description: description.trim(),
        reference_code: referenceCode.trim() || undefined,
        created_by: "admin",
      });

      if (!res.success) {
        toast.error(res.error || "No se pudo registrar el gasto");
        return;
      }

      toast.success(`Gasto de $${numAmount.toLocaleString("es-AR")} registrado correctamente`);
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error("Error al registrar el gasto");
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
              <TrendingDown className="w-5 h-5 text-red-400" />
              <span>Registrar gasto del local</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Egresos operativos que impactan en la ganancia real
            </p>
          </div>
        </div>
      </div>

      {/* Formulario en tarjeta integrada */}
      <form onSubmit={handleSubmit} className="dashboard-card p-6 space-y-5">
        {/* Concepto */}
        <div className="space-y-1.5">
          <label htmlFor="expense-desc-input" className="block text-xs font-semibold text-slate-300">
            Concepto / descripción del gasto
          </label>
          <input
            id="expense-desc-input"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej: Compra de café, hojas de afeitar, luz..."
            required
            className="w-full p-3 rounded-xl border border-white/10 bg-slate-900/80 text-sm text-white focus:border-[var(--accent)] outline-none"
          />
        </div>

        {/* Importe y Categoría */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="expense-amount-input" className="block text-xs font-semibold text-slate-300">
              Importe ($)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                $
              </span>
              <input
                id="expense-amount-input"
                type="number"
                min="1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="5000"
                required
                className="w-full pl-8 pr-3.5 py-3 rounded-xl border border-white/10 bg-slate-900/80 text-base font-bold text-white focus:border-[var(--accent)] outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="expense-cat-select" className="block text-xs font-semibold text-slate-300">
              Categoría
            </label>
            <select
              id="expense-cat-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 rounded-xl border border-white/10 bg-slate-900/80 text-xs text-white focus:border-[var(--accent)] outline-none h-[48px]"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Medio de Pago */}
        <div className="space-y-2">
          <span className="block text-xs font-semibold text-slate-300">
            Medio de pago utilizado
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {METHODS.map((m) => {
              const Icon = m.icon;
              const isSelected = paymentMethod === m.name;
              return (
                <button
                  key={m.name}
                  type="button"
                  onClick={() => setPaymentMethod(m.name)}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? "!bg-[var(--accent)]/15 !border-[var(--accent)]/50 !text-[var(--accent)] shadow-sm"
                      : "!bg-slate-900/60 !border-white/5 !text-slate-400 hover:!text-white hover:!bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[11px]">{m.name}</span>
                </button>
              );
            })}
          </div>
          {paymentMethod === "Efectivo" && (
            <p className="text-[11px] text-amber-300/90 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
              💡 Este gasto en efectivo se descontará automáticamente de la caja chica del local.
            </p>
          )}
        </div>

        {/* Comprobante / Ref opcional */}
        <div className="space-y-1.5">
          <label htmlFor="expense-ref-input" className="block text-xs font-semibold text-slate-300">
            Nº de ticket, factura o referencia (opcional)
          </label>
          <input
            id="expense-ref-input"
            type="text"
            value={referenceCode}
            onChange={(e) => setReferenceCode(e.target.value)}
            placeholder="Ej: Factura B 0001-00029"
            className="w-full p-3 rounded-xl border border-white/10 bg-slate-900/80 text-xs text-white focus:border-[var(--accent)] outline-none"
          />
        </div>

        {/* Botones de acción */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
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
            className="px-6 py-2.5 rounded-xl !bg-red-500 hover:!bg-red-600 !text-white font-bold text-xs shadow-md shadow-red-500/15 transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50 disabled:scale-100 flex items-center gap-1.5"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{isSubmitting ? "Guardando..." : "Guardar gasto"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
