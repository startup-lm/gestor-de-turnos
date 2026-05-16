"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { usePopup } from "@/lib/hooks/usePopup";
import PopupModal from "@/components/ui/PopupModal";
import Spinner from "@/components/loading/Spinner";
import { X } from "lucide-react";

interface Props {
  onClose: () => void;
}

export default function PaymentSettingsModal({ onClose }: Readonly<Props>) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [newMethod, setNewMethod] = useState("");
  const popup = usePopup();

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/business-settings");
        if (res.ok) {
          const data = await res.json();
          setPaymentMethods(data.payment_methods || ["Efectivo", "Mercado Pago"]);
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
    if (newMethod.trim() && !paymentMethods.includes(newMethod.trim())) {
      setPaymentMethods([...paymentMethods, newMethod.trim()]);
      setNewMethod("");
    }
  };

  const handleRemoveMethod = (method: string) => {
    setPaymentMethods(paymentMethods.filter((m) => m !== method));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/business-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_methods: paymentMethods }), // Send only payment methods
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

  return (
    <>
      <Modal onClose={onClose}>
        <div className="text-center mb-8">
          <div className="bg-[var(--primary)]/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-[var(--primary)]/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--primary)]"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">Métodos de Pago</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Gestioná los medios de cobro que aceptás en el local.
          </p>
        </div>

        <div className="space-y-6 px-1">
            <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-5 border border-[var(--border)]">
              <label className="block text-sm font-bold mb-3 text-[var(--foreground)]">
                Agregar nuevo método
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMethod}
                  onChange={(e) => setNewMethod(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddMethod()}
                  placeholder="Ej. Transferencia, Débito..."
                  className="flex-1 border-2 border-transparent bg-white dark:bg-[#111111] p-3.5 rounded-xl text-[var(--foreground)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 transition-all outline-none shadow-sm"
                />
                <button
                  type="button"
                  onClick={handleAddMethod}
                  className="!bg-[var(--primary)] !text-black px-6 py-3.5 rounded-xl font-bold shadow-lg hover:shadow-[var(--primary)]/40 hover:-translate-y-0.5 transition-all active:scale-95 flex items-center gap-2"
                >
                  Agregar
                </button>
              </div>

              <div className="mt-6">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                  Métodos Habilitados ({paymentMethods.length})
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {paymentMethods.length === 0 ? (
                    <span className="text-sm text-gray-400 italic">No hay métodos agregados.</span>
                  ) : (
                    paymentMethods.map((method) => (
                      <div
                        key={method}
                        className="group flex items-center gap-2 bg-white dark:bg-[#1C1C1C] text-[var(--foreground)] px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-800 shadow-sm hover:border-[var(--primary)] transition-colors"
                      >
                        <span className="truncate max-w-[150px]">{method}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMethod(method)}
                          className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded-full transition-colors ml-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 rounded-xl font-bold text-gray-500 hover:text-[var(--foreground)] hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="!bg-[var(--primary)] !text-black px-8 py-3 rounded-xl font-bold shadow-lg shadow-[var(--primary)]/20 hover:shadow-[var(--primary)]/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                    Guardando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </button>
            </div>
          </div>
      </Modal>

      {popup.show && (
        <PopupModal message={popup.message} success={popup.success} onClose={popup.close} />
      )}
    </>
  );
}
