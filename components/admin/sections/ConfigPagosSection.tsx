"use client";

import { useState } from "react";
import {
  Banknote,
  Wallet,
  ArrowRightLeft,
  CreditCard,
  Coins,
  Plus,
  X,
} from "lucide-react";
import { ConfigFormSkeleton } from "@/components/loading/Skeleton";
import SaveButton from "@/components/buttons/SaveButton";
import { toast } from "@/lib/store/useToastStore";
import { DEFAULT_PAYMENT_METHODS } from "@/lib/flags";
import { useBusinessContext } from "@/lib/context/BusinessContext";
import { useSettingsForm } from "@/lib/hooks/useSettingsForm";

type PresetMethod = {
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
};

const PRESET_METHODS: PresetMethod[] = [
  {
    name: "Efectivo",
    description: "Cobro físico directo en el local",
    icon: Banknote,
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  },
  {
    name: "Mercado Pago",
    description: "Dinero en cuenta, alias o QR digital",
    icon: Wallet,
    color: "text-sky-400 bg-sky-500/10 border-sky-500/30",
  },
  {
    name: "Transferencia",
    description: "Transferencia bancaria a CBU o CVU",
    icon: ArrowRightLeft,
    color: "text-purple-400 bg-purple-500/10 border-purple-500/30",
  },
  {
    name: "Tarjeta de débito",
    description: "Cobro con posnet débito físico",
    icon: CreditCard,
    color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  },
  {
    name: "Tarjeta de crédito",
    description: "Pagos con tarjeta de crédito",
    icon: Coins,
    color: "text-pink-400 bg-pink-500/10 border-pink-500/30",
  },
];

const PRESET_NAMES = new Set(PRESET_METHODS.map((p) => p.name));

type PagosDraft = {
  payment_methods: string[];
};

export default function ConfigPagosSection() {
  const { limits } = useBusinessContext();
  const maxPaymentMethods = limits.maxPaymentMethods;

  const [newMethod, setNewMethod] = useState("");

  const { draft, setDraft, loading, hasChanges, saving, save, reset } =
    useSettingsForm<PagosDraft>({
      pick: (settings) => ({
        payment_methods: settings.payment_methods || DEFAULT_PAYMENT_METHODS,
      }),
      toPayload: (currentDraft) => ({
        payment_methods: currentDraft.payment_methods,
      }),
    });

  const paymentMethods = draft?.payment_methods || [];
  const isAtLimit = paymentMethods.length >= maxPaymentMethods;
  const limitMessage = `Tu plan permite hasta ${maxPaymentMethods} medios de cobro`;

  const handleTogglePreset = (name: string) => {
    if (!draft) return;
    if (draft.payment_methods.includes(name)) {
      setDraft({
        ...draft,
        payment_methods: draft.payment_methods.filter((m) => m !== name),
      });
    } else if (isAtLimit) {
      toast.error(limitMessage);
    } else {
      setDraft({
        ...draft,
        payment_methods: [...draft.payment_methods, name],
      });
    }
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    const clean = newMethod.trim();
    if (!clean) return;
    if (draft.payment_methods.includes(clean)) {
      toast.error(`"${clean}" ya está en la lista`);
      return;
    }
    if (isAtLimit) {
      toast.error(limitMessage);
      return;
    }
    setDraft({
      ...draft,
      payment_methods: [...draft.payment_methods, clean],
    });
    setNewMethod("");
  };

  const handleRemove = (name: string) => {
    if (!draft) return;
    setDraft({
      ...draft,
      payment_methods: draft.payment_methods.filter((m) => m !== name),
    });
  };

  if (loading || !draft) {
    return <ConfigFormSkeleton />;
  }

  const customMethods = paymentMethods.filter((m) => !PRESET_NAMES.has(m));

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Cobros y caja
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Habilitá los métodos de pago aceptados para turnos y ventas en el local
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <button
              type="button"
              onClick={reset}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl border border-[var(--foreground)]/20 text-xs text-slate-300 hover:bg-white/5 hover:text-white font-medium transition-all cursor-pointer min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Descartar
            </button>
          )}
          <SaveButton
            type="button"
            onClick={() => void save()}
            loading={saving}
            disabled={!hasChanges || saving}
            className="w-full sm:w-auto min-h-[44px]"
          />
        </div>
      </div>

      {/* Métodos predefinidos */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold tracking-wider text-[var(--accent)]">
          Métodos principales (activar o desactivar)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
          {PRESET_METHODS.map((preset) => {
            const isActive = paymentMethods.includes(preset.name);
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleTogglePreset(preset.name)}
                className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  isActive
                    ? "!bg-[var(--foreground)]/10 !border-[var(--accent)]/50 shadow-md shadow-[var(--accent)]/5"
                    : "!bg-[var(--foreground)]/5 !border-[var(--foreground)]/10 opacity-70 hover:opacity-100"
                }`}
              >
                <div className={`p-2.5 rounded-xl border ${preset.color}`}>
                  <preset.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold !text-white">{preset.name}</h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive
                          ? "bg-emerald-500/20 !text-emerald-400"
                          : "bg-slate-800 !text-slate-400"
                      }`}
                    >
                      {isActive ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  <p className="text-xs !text-slate-300 mt-1">{preset.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Métodos personalizados */}
      <div className="bg-[var(--foreground)]/5 p-5 rounded-2xl border border-[var(--foreground)]/10 space-y-4">
        <h3 className="text-sm font-bold tracking-wider text-[var(--accent)]">
          Otros medios
        </h3>

        <form onSubmit={handleAddCustom} className="flex gap-2 max-w-md">
          <input
            type="text"
            value={newMethod}
            onChange={(e) => setNewMethod(e.target.value)}
            placeholder="Agregar otro medio"
            className="flex-1 p-2.5 rounded-xl border border-[var(--foreground)]/15 bg-[var(--background)] text-sm text-[var(--foreground)] focus:border-[var(--accent)] outline-none"
          />
          <button
            type="submit"
            disabled={isAtLimit}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl !bg-[var(--accent)] hover:!bg-[var(--accent-hover)] !text-slate-950 font-bold text-xs transition-all cursor-pointer shadow-md shadow-[var(--accent)]/15 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            Agregar
          </button>
        </form>
        {Number.isFinite(maxPaymentMethods) && (
          <p className="text-xs text-slate-400">{limitMessage}.</p>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          {customMethods.map((m) => (
            <span
              key={m}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--foreground)]/10 border border-[var(--foreground)]/15 text-[var(--foreground)]"
            >
              <span>{m}</span>
              <button
                type="button"
                onClick={() => handleRemove(m)}
                className="!bg-transparent text-slate-400 hover:text-rose-400 transition-colors p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
