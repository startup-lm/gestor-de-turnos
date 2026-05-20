"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { usePopup } from "@/lib/hooks/usePopup";
import PopupModal from "@/components/ui/PopupModal";
import Spinner from "@/components/loading/Spinner";
import { FaInstagram, FaFacebook, FaTiktok, FaWhatsapp, FaLink } from "react-icons/fa";

interface Props {
  onClose: () => void;
}

type SocialItem = { name: string; url: string; active: boolean };

const ICON_MAP: Record<string, React.ReactNode> = {
  instagram: <FaInstagram size={20} />,
  facebook: <FaFacebook size={20} />,
  tiktok: <FaTiktok size={20} />,
  whatsapp: <FaWhatsapp size={20} />,
};

export default function SocialMediaSettingsModal({ onClose }: Readonly<Props>) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [socials, setSocials] = useState<SocialItem[]>([]);
  const popup = usePopup();

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/business-settings");
        if (res.ok) {
          const data = await res.json();
          setSocials(data.social_media || [
            { name: "instagram", url: "", active: true },
            { name: "facebook", url: "", active: false },
            { name: "tiktok", url: "", active: false }
          ]);
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
        body: JSON.stringify({ social_media: socials }),
      });

      if (res.ok) {
        popup.open("Redes actualizadas con éxito", true);
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

  const updateSocial = (index: number, updates: Partial<SocialItem>) => {
    const newSocials = [...socials];
    newSocials[index] = { ...newSocials[index], ...updates };
    setSocials(newSocials);
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
        <h2 className="text-2xl font-bold mb-6 text-center text-[var(--foreground)]">Redes Sociales</h2>

        <div className="space-y-4 px-2 max-h-[60vh] overflow-y-auto text-left">
          {socials.map((social, index) => (
            <div key={social.name} className="bg-[var(--foreground)]/5 p-4 rounded-xl border border-[var(--foreground)]/10 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 capitalize font-semibold text-[var(--foreground)]">
                  <span className="text-[var(--accent)]">
                    {ICON_MAP[social.name] || <FaLink size={20} />}
                  </span>
                  <span>{social.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => updateSocial(index, { active: !social.active })}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${social.active ? 'bg-[var(--accent)]' : 'bg-gray-600'}`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${social.active ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </button>
              </div>
              {social.active && (
                <input
                  type="url"
                  placeholder={`Link a tu ${social.name}`}
                  value={social.url}
                  onChange={(e) => updateSocial(index, { url: e.target.value })}
                  className="w-full !bg-[var(--background)] !text-[var(--foreground)] !border !border-[var(--foreground)]/10 rounded-lg p-2.5 text-sm focus:outline-none focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-colors"
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-6 mt-4 border-t border-[var(--foreground)]/10">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl font-medium text-[var(--foreground)]/60 hover:bg-[var(--foreground)]/5 transition-colors mr-2 text-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="!bg-[var(--accent)] !text-[var(--primary)] px-6 py-2 rounded-xl font-bold hover:opacity-90 transition-all duration-200 disabled:opacity-50 text-sm shadow-md"
          >
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </Modal>

      {popup.show && (
        <PopupModal message={popup.message} success={popup.success} onClose={popup.close} />
      )}
    </>
  );
}
