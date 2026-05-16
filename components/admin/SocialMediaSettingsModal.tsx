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
      <Modal onClose={onClose}>
        <h2 className="text-2xl font-bold mb-6 text-center text-[var(--foreground)]">Redes Sociales</h2>

        <div className="space-y-4 px-2 max-h-[60vh] overflow-y-auto">
          {socials.map((social, index) => (
            <div key={social.name} className="bg-[var(--accent)] p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 capitalize font-semibold">
                  {ICON_MAP[social.name] || <FaLink size={20} />}
                  <span>{social.name}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={social.active}
                    onChange={(e) => updateSocial(index, { active: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[var(--primary)]"></div>
                </label>
              </div>
              {social.active && (
                <input
                  type="url"
                  placeholder={`Link a tu ${social.name}`}
                  value={social.url}
                  onChange={(e) => updateSocial(index, { url: e.target.value })}
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg p-2 text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
                />
              )}
            </div>
          ))}
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
      </Modal>

      {popup.show && (
        <PopupModal message={popup.message} success={popup.success} onClose={popup.close} />
      )}
    </>
  );
}
