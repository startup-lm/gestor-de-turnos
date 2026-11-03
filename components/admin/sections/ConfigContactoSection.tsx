"use client";

import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { FaInstagram, FaFacebook, FaTiktok } from "react-icons/fa";
import { MapPin, MessageCircle, Share2, Check } from "lucide-react";
import { ConfigFormSkeleton } from "@/components/loading/Skeleton";
import SaveButton from "@/components/buttons/SaveButton";
import { normalizePhone, formatPhoneDisplay } from "@/utils/phone";
import { useSettingsForm } from "@/lib/hooks/useSettingsForm";

type SocialItem = { name: string; url: string; active: boolean };

type ContactoDraft = {
  phone: string;
  address: string;
  socials: SocialItem[];
};

const ICON_MAP: Record<string, React.ReactNode> = {
  instagram: <FaInstagram size={20} className="text-pink-500" />,
  facebook: <FaFacebook size={20} className="text-blue-500" />,
  tiktok: <FaTiktok size={20} className="text-cyan-400" />,
};

const PREFIX_MAP: Record<string, string> = {
  instagram: "instagram.com/",
  facebook: "facebook.com/",
  tiktok: "tiktok.com/",
};

export default function ConfigContactoSection() {
  const { draft, setDraft, loading, hasChanges, saving, save, reset } =
    useSettingsForm<ContactoDraft>({
      pick: (settings) => {
        const norm = normalizePhone(settings.phone);
        const p = norm.isValid ? norm.e164 : settings.phone || "";
        const addr = settings.location_address || "";
        const s =
          Array.isArray(settings.social_media) && settings.social_media.length > 0
            ? settings.social_media
            : [
                { name: "instagram", url: "", active: true },
                { name: "facebook", url: "", active: false },
                { name: "tiktok", url: "", active: false },
              ];
        return {
          phone: p,
          address: addr,
          socials: s,
        };
      },
      toPayload: (currentDraft) => {
        const norm = normalizePhone(currentDraft.phone);
        const finalPhone = norm.isValid ? norm.e164 : currentDraft.phone;
        return {
          phone: finalPhone,
          location_address: currentDraft.address,
          social_media: currentDraft.socials,
        };
      },
    });

  const handlePhoneBlur = () => {
    if (!draft?.phone) return;
    const norm = normalizePhone(draft.phone);
    if (norm.isValid) {
      setDraft((prev) => (prev ? { ...prev, phone: norm.e164 } : null));
    }
  };

  const handleSocialUrlChange = (index: number, val: string) => {
    if (!draft) return;
    const updated = [...draft.socials];
    const prefix = PREFIX_MAP[updated[index].name] || "";
    let clean = val;
    if (clean.includes(prefix)) {
      clean = clean.split(prefix)[1] || "";
    }
    updated[index].url = clean.replace("@", "").trim();
    setDraft({ ...draft, socials: updated });
  };

  const toggleSocialActive = (index: number) => {
    if (!draft) return;
    const updated = [...draft.socials];
    updated[index].active = !updated[index].active;
    setDraft({ ...draft, socials: updated });
  };

  if (loading || !draft) {
    return <ConfigFormSkeleton />;
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      className="space-y-8 animate-in fade-in duration-300"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Contacto y canales
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configurá el teléfono de WhatsApp, la dirección del local y los enlaces a redes sociales
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
            type="submit"
            loading={saving}
            disabled={!hasChanges || saving}
            className="w-full sm:w-auto min-h-[44px]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* WhatsApp */}
        <div className="bg-[var(--foreground)]/5 p-5 rounded-2xl border border-[var(--foreground)]/10 space-y-3">
          <div className="flex items-center gap-2 text-[var(--accent)] font-bold text-sm tracking-wider">
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp del local</span>
          </div>
          <p className="text-xs text-slate-400">
            Número de WhatsApp del local: los clientes lo usan para consultas y para confirmar sus turnos.
          </p>
          <div className="pt-1">
            <PhoneInput
              international
              defaultCountry="AR"
              value={draft.phone}
              onChange={(val) =>
                setDraft((prev) => (prev ? { ...prev, phone: val || "" } : null))
              }
              onBlur={handlePhoneBlur}
              placeholder="+54 9 11 2345 6789"
              className="phone-input-custom !bg-[var(--background)] p-2.5 rounded-xl border border-[var(--foreground)]/15 text-sm text-[var(--foreground)] w-full"
            />
          </div>
          {draft.phone && (
            <div className="flex items-center justify-between text-xs px-1">
              <span className="text-slate-400">
                Visualización:{" "}
                <span className="font-mono text-slate-200">
                  {formatPhoneDisplay(draft.phone)}
                </span>
              </span>
              {normalizePhone(draft.phone).isValid && (
                <span className="text-emerald-400 font-medium text-[11px]">
                  Válido para WhatsApp
                </span>
              )}
            </div>
          )}
        </div>

        {/* Ubicación */}
        <div className="bg-[var(--foreground)]/5 p-5 rounded-2xl border border-[var(--foreground)]/10 space-y-3">
          <div className="flex items-center gap-2 text-[var(--accent)] font-bold text-sm tracking-wider">
            <MapPin className="w-4 h-4" />
            <span>Dirección del local</span>
          </div>
          <p className="text-xs text-slate-400">
            Dirección física visible en la sección Nosotros y en el mapa de Google:
          </p>
          <input
            type="text"
            value={draft.address}
            onChange={(e) =>
              setDraft((prev) => (prev ? { ...prev, address: e.target.value } : null))
            }
            placeholder="Ej: Av. Santa Fe 1234, Palermo, CABA"
            className="w-full p-2.5 rounded-xl border border-[var(--foreground)]/15 bg-[var(--background)] text-sm text-[var(--foreground)] focus:border-[var(--accent)] outline-none"
          />
        </div>
      </div>

      {/* Redes Sociales */}
      <div className="bg-[var(--foreground)]/5 p-5 rounded-2xl border border-[var(--foreground)]/10 space-y-4">
        <div className="flex items-center gap-2 text-[var(--accent)] font-bold text-sm tracking-wider">
          <Share2 className="w-4 h-4" />
          <span>Redes sociales</span>
        </div>
        <p className="text-xs text-slate-400">
          Ingresá el usuario o link de cada red social y marcá cuáles querés mostrar en el sitio:
        </p>

        <div className="space-y-3">
          {draft.socials.map((item, index) => {
            const prefix = PREFIX_MAP[item.name] || "";
            return (
              <div
                key={item.name}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3.5 rounded-xl border border-[var(--foreground)]/10 bg-[var(--background)]/40"
              >
                <div className="flex items-center gap-2.5 min-w-[130px]">
                  {ICON_MAP[item.name]}
                  <span className="text-xs font-bold capitalize text-slate-200">
                    {item.name}
                  </span>
                </div>

                <div className="flex-1 flex items-center w-full">
                  <span className="text-xs text-slate-500 bg-[var(--foreground)]/5 px-2.5 py-2 rounded-l-lg border-y border-l border-[var(--foreground)]/10">
                    {prefix}
                  </span>
                  <input
                    type="text"
                    value={item.url}
                    onChange={(e) => handleSocialUrlChange(index, e.target.value)}
                    placeholder="usuario"
                    className="flex-1 p-2 text-xs rounded-r-lg border border-[var(--foreground)]/10 bg-[var(--background)] text-[var(--foreground)] focus:border-[var(--accent)] outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => toggleSocialActive(index)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    item.active
                      ? "!bg-emerald-500/20 !text-emerald-300 !border !border-emerald-500/40 hover:!bg-emerald-500/30 shadow-sm"
                      : "!bg-slate-800/80 !text-slate-400 !border !border-slate-700 hover:!text-slate-200 hover:!bg-slate-800"
                  }`}
                >
                  {item.active && <Check className="w-3.5 h-3.5" />}
                  {item.active ? "Visible" : "Oculto"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </form>
  );
}
