"use client";

import { useState, useEffect } from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { FaInstagram, FaFacebook, FaTiktok } from "react-icons/fa";
import { MapPin, MessageCircle, Share2, Check } from "lucide-react";
import Spinner from "@/components/loading/Spinner";
import SaveButton from "@/components/buttons/SaveButton";
import { toast } from "@/lib/store/useToastStore";

type SocialItem = { name: string; url: string; active: boolean };

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [socials, setSocials] = useState<SocialItem[]>([
    { name: "instagram", url: "", active: true },
    { name: "facebook", url: "", active: false },
    { name: "tiktok", url: "", active: false },
  ]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch("/api/business-settings");
        if (res.ok) {
          const data = await res.json();
          setPhone(data.phone || "");
          setAddress(data.location_address || "");
          if (Array.isArray(data.social_media) && data.social_media.length > 0) {
            setSocials(data.social_media);
          }
        }
      } catch (err) {
        console.error("Error al cargar contacto:", err);
        toast.error("Error al cargar datos de contacto");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSocialUrlChange = (index: number, val: string) => {
    const updated = [...socials];
    const prefix = PREFIX_MAP[updated[index].name] || "";
    let clean = val;
    if (clean.includes(prefix)) {
      clean = clean.split(prefix)[1] || "";
    }
    updated[index].url = clean.replace("@", "").trim();
    setSocials(updated);
  };

  const toggleSocialActive = (index: number) => {
    const updated = [...socials];
    updated[index].active = !updated[index].active;
    setSocials(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/business-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          location_address: address,
          social_media: socials,
        }),
      });

      if (res.ok) {
        toast.success("Contacto y redes guardados con éxito");
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

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
          Contacto y Canales
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Configurá el teléfono de WhatsApp, la dirección del local y los enlaces a redes sociales
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* WhatsApp */}
        <div className="bg-[var(--foreground)]/5 p-5 rounded-2xl border border-[var(--foreground)]/10 space-y-3">
          <div className="flex items-center gap-2 text-[var(--accent)] font-bold text-sm uppercase tracking-wider">
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp del Local</span>
          </div>
          <p className="text-xs text-slate-400">
            Número para recibir consultas de clientes y enviar confirmaciones automáticas de turnos:
          </p>
          <div className="pt-1">
            <PhoneInput
              international
              defaultCountry="AR"
              value={phone}
              onChange={(val) => setPhone(val || "")}
              className="phone-input-custom !bg-[var(--background)] p-2.5 rounded-xl border border-[var(--foreground)]/15 text-sm text-[var(--foreground)] w-full"
            />
          </div>
        </div>

        {/* Ubicación */}
        <div className="bg-[var(--foreground)]/5 p-5 rounded-2xl border border-[var(--foreground)]/10 space-y-3">
          <div className="flex items-center gap-2 text-[var(--accent)] font-bold text-sm uppercase tracking-wider">
            <MapPin className="w-4 h-4" />
            <span>Dirección del Local</span>
          </div>
          <p className="text-xs text-slate-400">
            Dirección física visible en la sección Nosotros y en el mapa de Google:
          </p>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Ej: Av. Santa Fe 1234, Palermo, CABA"
            className="w-full p-2.5 rounded-xl border border-[var(--foreground)]/15 bg-[var(--background)] text-sm text-[var(--foreground)] focus:border-[var(--accent)] outline-none"
          />
        </div>
      </div>

      {/* Redes Sociales */}
      <div className="bg-[var(--foreground)]/5 p-5 rounded-2xl border border-[var(--foreground)]/10 space-y-4">
        <div className="flex items-center gap-2 text-[var(--accent)] font-bold text-sm uppercase tracking-wider">
          <Share2 className="w-4 h-4" />
          <span>Redes Sociales</span>
        </div>
        <p className="text-xs text-slate-400">
          Ingresá el usuario o link de cada red social y marcá cuáles querés mostrar en el sitio:
        </p>

        <div className="space-y-3">
          {socials.map((item, index) => {
            const prefix = PREFIX_MAP[item.name] || "";
            return (
              <div
                key={item.name}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3.5 rounded-xl border border-[var(--foreground)]/10 bg-[var(--background)]/40"
              >
                <div className="flex items-center gap-2.5 min-w-[130px]">
                  {ICON_MAP[item.name]}
                  <span className="text-xs font-bold capitalize text-slate-200">{item.name}</span>
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

      <div className="flex justify-end pt-2">
        <SaveButton type="submit" loading={saving} disabled={saving} />
      </div>
    </form>
  );
}
