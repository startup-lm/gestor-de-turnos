"use client";

import { useState, useEffect } from "react";
import { Banknote, Wallet, ArrowRightLeft, CreditCard, Coins, Plus, X } from "lucide-react";
import { ConfigFormSkeleton } from "@/components/loading/Skeleton";
import SaveButton from "@/components/buttons/SaveButton";
import { toast } from "@/lib/store/useToastStore";

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

export default function ConfigPagosSection() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [initialMethods, setInitialMethods] = useState<string[]>([]);
  const [newMethod, setNewMethod] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch("/api/business-settings");
        if (res.ok) {
          const data = await res.json();
          const loaded = data.payment_methods || ["Efectivo", "Mercado Pago"];
          setPaymentMethods(loaded);
          setInitialMethods(loaded);
        }
      } catch (err) {
        console.error("Error al cargar medios de pago:", err);
        toast.error("Error al cargar configuración de pagos");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleTogglePreset = (name: string) => {
    if (paymentMethods.includes(name)) {
      setPaymentMethods(paymentMethods.filter((m) => m !== name));
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
    setPaymentMethods([...paymentMethods, clean]);
    setNewMethod("");
  };

  const handleRemove = (name: string) => {
    setPaymentMethods(paymentMethods.filter((m) => m !== name));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/business-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_methods: paymentMethods }),
      });

      if (res.ok) {
        setInitialMethods([...paymentMethods]);
        toast.success("Medios de pago actualizados con éxito");
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
    paymentMethods.some((m) => !initialMethods.includes(m));

  if (loading) {
    return <ConfigFormSkeleton />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Medios de pago
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Habilitá los métodos de pago aceptados para turnos y ventas en el local
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
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl !bg-[var(--accent)] hover:!bg-[#E8CA8C] !text-slate-950 font-bold text-xs transition-all cursor-pointer shadow-md shadow-[var(--accent)]/15"
          >
            <Plus className="w-4 h-4" />
            Agregar
          </button>
        </form>

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
