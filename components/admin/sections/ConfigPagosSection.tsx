"use client";

import { useState, useEffect } from "react";
import {
  Banknote,
  Wallet,
  ArrowRightLeft,
  CreditCard,
  Coins,
  Plus,
  X,
  Receipt,
  Calendar,
  Clock,
  Sliders,
  CheckCircle2,
} from "lucide-react";
import { ConfigFormSkeleton } from "@/components/loading/Skeleton";
import SaveButton from "@/components/buttons/SaveButton";
import { toast } from "@/lib/store/useToastStore";
import { DEFAULT_PAYMENT_METHODS } from "@/lib/flags";
import { useBusinessContext } from "@/lib/context/BusinessContext";
import { CashClosingFrequency } from "@/lib/types/cash";

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

const CLOSING_FREQUENCIES: Array<{
  id: CashClosingFrequency;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: "daily",
    title: "Diario (al final del día)",
    description: "Cierre y arqueo de caja al concluir cada jornada laboral.",
    icon: Clock,
  },
  {
    id: "weekly",
    title: "Semanal (al finalizar la semana)",
    description: "Cierre acumulado en el último día de trabajo de la semana.",
    icon: Calendar,
  },
  {
    id: "manual",
    title: "Personalizado / Manual",
    description: "El administrador abre y cierra la caja a demanda según necesidad.",
    icon: Sliders,
  },
];

export default function ConfigPagosSection() {
  const { isEnabled, limits } = useBusinessContext();
  const isFinancesEnabled = isEnabled("finances");
  const maxPaymentMethods = limits.maxPaymentMethods;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [initialMethods, setInitialMethods] = useState<string[]>([]);
  const [newMethod, setNewMethod] = useState("");

  const [cashClosingFrequency, setCashClosingFrequency] = useState<CashClosingFrequency>("daily");
  const [initialFrequency, setInitialFrequency] = useState<CashClosingFrequency>("daily");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch("/api/business-settings");
        if (res.ok) {
          const data = await res.json();
          const loaded = data.payment_methods || DEFAULT_PAYMENT_METHODS;
          setPaymentMethods(loaded);
          setInitialMethods(loaded);

          const loadedFreq = (data.cash_closing_frequency as CashClosingFrequency) || "daily";
          setCashClosingFrequency(loadedFreq);
          setInitialFrequency(loadedFreq);
        }
      } catch (err) {
        console.error("Error al cargar configuración de pagos:", err);
        toast.error("Error al cargar configuración de pagos");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const isAtLimit = paymentMethods.length >= maxPaymentMethods;
  const limitMessage = `Tu plan permite hasta ${maxPaymentMethods} medios de cobro`;

  const handleTogglePreset = (name: string) => {
    if (paymentMethods.includes(name)) {
      setPaymentMethods(paymentMethods.filter((m) => m !== name));
    } else if (isAtLimit) {
      toast.error(limitMessage);
    } else {
      setPaymentMethods([...paymentMethods, name]);
    }
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newMethod.trim();
    if (!clean) return;
    if (paymentMethods.includes(clean)) {
      toast.error(`"${clean}" ya está en la lista`);
      return;
    }
    if (isAtLimit) {
      toast.error(limitMessage);
      return;
    }
    setPaymentMethods([...paymentMethods, clean]);
    setNewMethod("");
  };

  const handleRemove = (name: string) => {
    setPaymentMethods(paymentMethods.filter((m) => m !== name));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: {
        payment_methods: string[];
        cash_closing_frequency?: CashClosingFrequency;
      } = {
        payment_methods: paymentMethods,
      };

      if (isFinancesEnabled) {
        payload.cash_closing_frequency = cashClosingFrequency;
      }

      const res = await fetch("/api/business-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setInitialMethods([...paymentMethods]);
        setInitialFrequency(cashClosingFrequency);
        toast.success("Configuración actualizada con éxito");
      } else {
        toast.error("Error al guardar la configuración");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error de conexión al guardar");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges =
    paymentMethods.length !== initialMethods.length ||
    paymentMethods.some((m) => !initialMethods.includes(m)) ||
    (isFinancesEnabled && cashClosingFrequency !== initialFrequency);

  if (loading) {
    return <ConfigFormSkeleton />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            {isFinancesEnabled ? "Medios de pago y caja" : "Medios de pago"}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isFinancesEnabled
              ? "Habilitá los métodos de pago aceptados y configurá los turnos de caja de tu local"
              : "Habilitá los métodos de pago aceptados para turnos y ventas en el local"}
          </p>
        </div>
        <SaveButton
          type="button"
          onClick={handleSave}
          loading={saving}
          disabled={!hasChanges || saving}
          className="w-full sm:w-auto"
        />
      </div>

      {/* Frecuencia de Cierre de Caja (solo visible si el plan incluye finanzas) */}
      {isFinancesEnabled && (
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)]">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Caja y Cierres de Turno</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Plan Activo
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Elegí la periodicidad con la que tu barbería realiza el balance y arqueo de caja
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {CLOSING_FREQUENCIES.map((freq) => {
              const Icon = freq.icon;
              const isSelected = cashClosingFrequency === freq.id;
              return (
                <button
                  key={freq.id}
                  type="button"
                  onClick={() => setCashClosingFrequency(freq.id)}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    isSelected
                      ? "!bg-[var(--accent)]/15 !border-[var(--accent)]/50 shadow-md shadow-[var(--accent)]/5"
                      : "!bg-slate-950/40 !border-white/5 opacity-70 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`p-2 rounded-lg border ${
                        isSelected
                          ? "bg-[var(--accent)]/20 border-[var(--accent)]/40 text-[var(--accent)]"
                          : "bg-white/5 border-white/10 text-slate-400"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-[var(--accent)]" />
                    )}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">{freq.title}</h5>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                      {freq.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

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
          Otros métodos habilitados
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
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl !bg-[var(--accent)] hover:!bg-[#E8CA8C] !text-slate-950 font-bold text-xs transition-all cursor-pointer shadow-md shadow-[var(--accent)]/15 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Agregar
          </button>
        </form>
        {Number.isFinite(maxPaymentMethods) && (
          <p className="text-xs text-slate-400">{limitMessage}.</p>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          {paymentMethods.map((m) => (
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
