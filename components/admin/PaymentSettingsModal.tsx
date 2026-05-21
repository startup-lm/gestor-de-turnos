"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { usePopup } from "@/lib/hooks/usePopup";
import PopupModal from "@/components/ui/PopupModal";
import Spinner from "@/components/loading/Spinner";
import { X, CreditCard, Banknote, ArrowRightLeft, Wallet, Plus, Check, Coins, HelpCircle } from "lucide-react";
import SaveButton from "@/components/buttons/SaveButton";

interface Props {
  onClose: () => void;
}

type PresetMethod = {
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  activeClass: string;
  inactiveClass: string;
  iconColor: string;
};

const PRESET_METHODS: PresetMethod[] = [
  {
    name: "Efectivo",
    description: "Pago físico en el local",
    icon: Banknote,
    activeClass: "!border-green-500/40 !bg-[#0a2f1d]/90 shadow-[0_0_15px_rgba(34,197,94,0.15)]",
    inactiveClass: "!border-slate-800 !bg-[#131c33] hover:!border-green-500/30 hover:!bg-[#0a2f1d]/40",
    iconColor: "text-green-400"
  },
  {
    name: "Mercado Pago",
    description: "Dinero en cuenta o QR",
    icon: Wallet,
    activeClass: "!border-blue-500/40 !bg-[#0b2545]/90 shadow-[0_0_15px_rgba(59,130,246,0.15)]",
    inactiveClass: "!border-slate-800 !bg-[#131c33] hover:!border-blue-500/30 hover:!bg-[#0b2545]/40",
    iconColor: "text-blue-400"
  },
  {
    name: "Transferencia",
    description: "Alias o CBU bancario",
    icon: ArrowRightLeft,
    activeClass: "!border-purple-500/40 !bg-[#221045]/90 shadow-[0_0_15px_rgba(168,85,247,0.15)]",
    inactiveClass: "!border-slate-800 !bg-[#131c33] hover:!border-purple-500/30 hover:!bg-[#221045]/40",
    iconColor: "text-purple-400"
  },
  {
    name: "Tarjeta de Débito",
    description: "Visa, Mastercard, etc.",
    icon: CreditCard,
    activeClass: "!border-orange-500/40 !bg-[#2d1204]/90 shadow-[0_0_15px_rgba(249,115,22,0.15)]",
    inactiveClass: "!border-slate-800 !bg-[#131c33] hover:!border-orange-500/30 hover:!bg-[#2d1204]/40",
    iconColor: "text-orange-400"
  },
  {
    name: "Tarjeta de Crédito",
    description: "Pagos diferidos o cuotas",
    icon: Coins,
    activeClass: "!border-pink-500/40 !bg-[#30081d]/90 shadow-[0_0_15px_rgba(236,72,153,0.15)]",
    inactiveClass: "!border-slate-800 !bg-[#131c33] hover:!border-pink-500/30 hover:!bg-[#30081d]/40",
    iconColor: "text-pink-400"
  }
];

export default function PaymentSettingsModal({ onClose }: Readonly<Props>) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [originalPaymentMethods, setOriginalPaymentMethods] = useState<string[]>([]);
  const [newMethod, setNewMethod] = useState("");
  const popup = usePopup();

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/business-settings");
        if (res.ok) {
          const data = await res.json();
          const val = data.payment_methods || ["Efectivo", "Mercado Pago"];
          setPaymentMethods(val);
          setOriginalPaymentMethods(val);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleAddMethod = () => {
    const trimmed = newMethod.trim();
    if (!trimmed) return;

    // Convert or map to standard preset names if they write something similar
    const matchingPreset = PRESET_METHODS.find(
      (p) => p.name.toLowerCase() === trimmed.toLowerCase()
    );

    const targetName = matchingPreset ? matchingPreset.name : trimmed;

    if (!paymentMethods.includes(targetName)) {
      setPaymentMethods([...paymentMethods, targetName]);
      setNewMethod("");
    } else {
      popup.open(`El método "${targetName}" ya está habilitado`, false);
    }
  };

  const handleRemoveMethod = (method: string) => {
    setPaymentMethods(paymentMethods.filter((m) => m !== method));
  };

  const handleTogglePreset = (presetName: string) => {
    if (paymentMethods.includes(presetName)) {
      setPaymentMethods(paymentMethods.filter((m) => m !== presetName));
    } else {
      setPaymentMethods([...paymentMethods, presetName]);
    }
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
        popup.open("Configuración actualizada con éxito", true);
        setTimeout(() => onClose(), 1500);
      } else {
        popup.open("Error al guardar la configuración", false);
      }
    } catch {
      popup.open("Error al conectar con el servidor", false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
        <Spinner />
      </div>
    );
  }

  // Filter custom methods added by the user
  const customMethods = paymentMethods.filter(
    (method) => !PRESET_METHODS.some((preset) => preset.name === method)
  );

  // Deep comparison of arrays ignoring order
  const hasChanges = !(
    paymentMethods.length === originalPaymentMethods.length &&
    [...paymentMethods].sort().every((v, i) => v === [...originalPaymentMethods].sort()[i])
  );

  const isSaveDisabled = saving || !hasChanges;

  return (
    <>
      <Modal onClose={onClose} size="lg">
        {/* Encabezado Premium */}
        <div className="text-center mb-8">
          <div className="bg-[var(--accent)]/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-[var(--accent)]/20 shadow-[0_0_15px_rgba(212,181,138,0.2)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">Métodos de Pago</h2>
          <p className="text-sm text-[var(--foreground)]/50 mt-2">
            Gestioná los medios de cobro que aceptás en tu local.
          </p>
        </div>

        <div className="space-y-6 px-1 text-left">
          {/* Grilla de Métodos Populares */}
          <div>
            <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-3 ml-1">
              Métodos de Pago Populares
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              {PRESET_METHODS.map((preset) => {
                const isActive = paymentMethods.includes(preset.name);
                const IconComponent = preset.icon;
                return (
                  <div
                    key={preset.name}
                    role="button"
                    onClick={() => handleTogglePreset(preset.name)}
                    className={`flex items-start gap-3.5 p-3.5 rounded-2xl border text-left transition-all duration-300 relative group overflow-hidden cursor-pointer ${
                      isActive ? preset.activeClass : preset.inactiveClass
                    }`}
                  >
                    <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800 flex items-center justify-center transition-transform group-hover:scale-110 duration-300">
                      <IconComponent size={20} className={preset.iconColor} />
                    </div>
                    <div>
                      <h4 className={`text-sm font-bold transition-colors ${isActive ? 'text-white font-extrabold' : 'text-slate-200 font-semibold'}`}>{preset.name}</h4>
                      <p className={`text-[11px] mt-0.5 leading-relaxed font-medium transition-colors ${isActive ? 'text-slate-200/90 font-semibold' : 'text-slate-400 font-medium'}`}>
                        {preset.description}
                      </p>
                    </div>
                    {isActive && (
                      <div className="absolute top-3 right-3 bg-green-500 text-black p-0.5 rounded-full border border-green-400">
                        <Check size={10} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Métodos Personalizados Activos */}
          {customMethods.length > 0 && (
            <div className="animate-fadeIn">
              <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-2.5 ml-1">
                Métodos Personalizados Habilitados
              </label>
              <div className="flex flex-wrap gap-2">
                {customMethods.map((method) => (
                  <div
                    key={method}
                    className="flex items-center gap-2 bg-slate-900/60 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-800 shadow-sm hover:border-[var(--accent)]/50 transition-colors duration-200"
                  >
                    <span>{method}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMethod(method)}
                      className="text-slate-400 hover:text-red-500 hover:bg-red-500/10 p-0.5 rounded-md transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Agregar Método Personalizado */}
          <div className="bg-[#131c33] rounded-2xl p-4.5 border border-slate-800">
            <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-2.5 ml-1">
              Agregar otro método de pago
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-[14px] text-slate-400">
                  <HelpCircle size={16} />
                </span>
                <input
                  type="text"
                  value={newMethod}
                  onChange={(e) => setNewMethod(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddMethod()}
                  placeholder="Ej. Crypto, Cuenta DNI, Ualá..."
                  className="w-full !border !border-slate-800 !bg-slate-950/50 pl-10 pr-3.5 rounded-xl !text-slate-200 placeholder:text-slate-500 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all outline-none text-sm h-[44px]"
                />
              </div>
              <button
                type="button"
                onClick={handleAddMethod}
                className="!bg-[var(--accent)] !text-[var(--primary)] px-5 rounded-xl font-bold transition-all hover:opacity-90 flex items-center justify-center text-sm shadow-md h-[44px]"
              >
                <Plus size={16} className="mr-1.5" />
                Agregar
              </button>
            </div>
          </div>

          {/* Guardar */}
          <div className="flex justify-center pt-6 mt-6 border-t border-[var(--foreground)]/10">
            <div className="w-[200px]">
              <SaveButton
                onClick={handleSave}
                disabled={isSaveDisabled}
                loading={saving}
              />
            </div>
          </div>
        </div>
      </Modal>

      {popup.show && (
        <PopupModal message={popup.message} success={popup.success} onClose={popup.close} />
      )}
    </>
  );
}
