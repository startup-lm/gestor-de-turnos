"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { usePopup } from "@/lib/hooks/usePopup";
import PopupModal from "@/components/ui/PopupModal";
import Spinner from "@/components/loading/Spinner";
import { FaInstagram, FaFacebook, FaTiktok, FaLink } from "react-icons/fa";
import { Share2 } from "lucide-react";
import SaveButton from "@/components/buttons/SaveButton";

interface Props {
  onClose: () => void;
}

type SocialItem = { name: string; url: string; active: boolean };

const ICON_MAP: Record<string, React.ReactNode> = {
  instagram: <FaInstagram size={22} className="text-pink-500" />,
  facebook: <FaFacebook size={22} className="text-blue-500" />,
  tiktok: <FaTiktok size={22} className="text-cyan-400" />,
};

const PREFIX_MAP: Record<string, string> = {
  instagram: "instagram.com/",
  facebook: "facebook.com/",
  tiktok: "tiktok.com/",
};

export default function SocialMediaSettingsModal({ onClose }: Readonly<Props>) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [socials, setSocials] = useState<SocialItem[]>([]);
  const [originalSocials, setOriginalSocials] = useState<SocialItem[]>([]);
  const popup = usePopup();

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/business-settings");
        if (res.ok) {
          const data = await res.json();
          const val = data.social_media || [
            { name: "instagram", url: "", active: true },
            { name: "facebook", url: "", active: false },
            { name: "tiktok", url: "", active: false }
          ];
          setSocials(val);
          setOriginalSocials(val);
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

  const isSaveDisabled = saving || JSON.stringify(socials) === JSON.stringify(originalSocials);

  return (
    <>
      <Modal onClose={onClose} size="md">
        {/* Encabezado Premium */}
        <div className="text-center mb-8">
          <div className="bg-[var(--accent)]/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-[var(--accent)]/20 shadow-[0_0_15px_rgba(212,181,138,0.2)]">
            <Share2 className="w-7 h-7 text-[var(--accent)]" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">Redes Sociales</h2>
          <p className="text-sm text-[var(--foreground)]/50 mt-2">
            Conectá con tus clientes en sus plataformas favoritas.
          </p>
        </div>

        {/* Tarjetas de Redes Sociales */}
        <div className="space-y-4 px-1 max-h-[50vh] overflow-y-auto text-left">
          {socials.map((social, index) => (
            <div
              key={social.name}
              className={`bg-[#131c33] p-4 rounded-2xl border transition-all duration-300 ${
                social.active ? "border-[var(--accent)]/30 shadow-[0_4px_20px_rgba(0,0,0,0.15)]" : "border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 capitalize font-bold text-slate-100">
                  <span className="p-2 rounded-xl bg-slate-950/40 border border-slate-800 flex items-center justify-center">
                    {ICON_MAP[social.name] || <FaLink size={22} className="text-[var(--accent)]" />}
                  </span>
                  <span className="text-sm tracking-wide">{social.name}</span>
                </div>
                <div
                  role="button"
                  onClick={() => updateSocial(index, { active: !social.active })}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                    social.active ? "bg-green-500" : "bg-neutral-600"
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                      social.active ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </div>
              </div>

              {social.active && (
                <div className="mt-4 transition-all duration-300 ease-in-out animate-fadeIn">
                  <label className="block text-[10px] font-semibold text-[var(--accent)] uppercase tracking-widest mb-1.5 ml-1">
                    Enlace de Perfil
                  </label>
                  <div className="relative flex items-center w-full !bg-slate-950/50 !text-slate-200 border border-slate-800 rounded-xl overflow-hidden focus-within:!border-[var(--accent)]/50 focus-within:!ring-1 focus-within:!ring-[var(--accent)]/50 transition-all h-[44px]">
                    <span className="bg-slate-900/60 text-slate-400 px-3 text-xs h-full flex items-center border-r border-slate-800 font-bold select-none">
                      {PREFIX_MAP[social.name] || ""}
                    </span>
                    <input
                      type="text"
                      placeholder="usuario"
                      value={social.url}
                      onChange={(e) => updateSocial(index, { url: e.target.value })}
                      className="flex-1 bg-transparent text-slate-200 px-3 text-sm h-full focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div className="flex justify-center pt-6 mt-6 border-t border-[var(--foreground)]/10">
          <div className="w-[200px]">
            <SaveButton
              onClick={handleSave}
              disabled={isSaveDisabled}
              loading={saving}
            />
          </div>
        </div>
      </Modal>

      {popup.show && (
        <PopupModal message={popup.message} success={popup.success} onClose={popup.close} />
      )}
    </>
  );
}
