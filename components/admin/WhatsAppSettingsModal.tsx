"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { usePopup } from "@/lib/hooks/usePopup";
import PopupModal from "@/components/ui/PopupModal";
import Spinner from "@/components/loading/Spinner";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

interface Props {
  onClose: () => void;
}

export default function WhatsAppSettingsModal({ onClose }: Readonly<Props>) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [phone, setPhone] = useState("");
  const popup = usePopup();

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/business-settings");
        if (res.ok) {
          const data = await res.json();
          setPhone(data.phone || "");
        }
      } catch {
        console.error("Failed to fetch");
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/business-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }), // Send only phone to update
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
        <h2 className="text-2xl font-bold mb-6 text-center text-[var(--foreground)]">WhatsApp del Local</h2>

        <div className="space-y-6 px-2">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                Teléfono de Contacto
              </label>
              <PhoneInput
                id="whatsapp-settings-phone"
                defaultCountry="AR"
                value={phone}
                onChange={(value) => setPhone(value || "")}
                placeholder="1123456789"
                className="w-full"
                numberInputProps={{
                  className: "w-full border-none focus:outline-none p-0 bg-transparent text-[var(--foreground)]",
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid var(--border)',
                  padding: '0.75rem',
                  borderRadius: '0.75rem',
                  backgroundColor: 'var(--background)'
                }}
              />
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Este es el número al que se redirigirán los clientes para confirmar sus turnos. Asegurate de incluir el código de país (Ej. +549 para Argentina).
              </p>
            </div>

            <div className="flex justify-end pt-6 mt-4 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 rounded-xl font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors mr-2"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="!bg-[var(--primary)] !text-black px-6 py-2 rounded-xl font-bold shadow-lg shadow-[var(--primary)]/20 hover:shadow-[var(--primary)]/40 hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:transform-none"
              >
                {saving ? "Guardando..." : "Guardar Cambios"}
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
