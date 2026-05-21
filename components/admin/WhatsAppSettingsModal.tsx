"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { usePopup } from "@/lib/hooks/usePopup";
import PopupModal from "@/components/ui/PopupModal";
import Spinner from "@/components/loading/Spinner";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import SaveButton from "@/components/buttons/SaveButton";

interface Props {
  onClose: () => void;
}

export default function WhatsAppSettingsModal({ onClose }: Readonly<Props>) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [phone, setPhone] = useState("");
  const [originalPhone, setOriginalPhone] = useState("");
  const popup = usePopup();

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/business-settings");
        if (res.ok) {
          const data = await res.json();
          const val = data.phone || "";
          setPhone(val);
          setOriginalPhone(val);
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
      <Modal onClose={onClose} size="md">
        <h2 className="text-2xl font-bold mb-6 text-center text-[var(--foreground)]">WhatsApp del Local</h2>

        <div className="space-y-6 px-2 text-left">
            <div>
              <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-2">
                Teléfono de Contacto
              </label>
              <PhoneInput
                id="whatsapp-settings-phone"
                defaultCountry="AR"
                value={phone}
                onChange={(value) => setPhone(value || "")}
                placeholder="1123456789"
                className="w-full text-sm"
                numberInputProps={{
                  className: "w-full border-none focus:outline-none p-0 bg-transparent text-[var(--foreground)] text-sm",
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid rgba(249, 250, 251, 0.1)',
                  padding: '0.625rem',
                  borderRadius: '0.5rem',
                  backgroundColor: 'rgba(249, 250, 251, 0.05)',
                }}
              />
              <p className="text-xs text-[var(--foreground)]/40 mt-2 leading-relaxed">
                Este es el número al que se redirigirán los clientes para confirmar sus turnos. Asegurate de incluir el código de país (Ej. +549 para Argentina).
              </p>
            </div>

            <div className="flex justify-center pt-6 mt-4 border-t border-[var(--foreground)]/10">
              <div className="w-[200px]">
                <SaveButton
                  onClick={handleSave}
                  disabled={saving || phone === originalPhone}
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
