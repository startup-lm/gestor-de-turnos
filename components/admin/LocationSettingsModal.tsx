"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { usePopup } from "@/lib/hooks/usePopup";
import PopupModal from "@/components/ui/PopupModal";
import Spinner from "@/components/loading/Spinner";
import { MapPin, CheckCircle, AlertTriangle } from "lucide-react";
import SaveButton from "@/components/buttons/SaveButton";

interface Props {
  onClose: () => void;
}

export default function LocationSettingsModal({ onClose }: Readonly<Props>) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [address, setAddress] = useState("");
  const [originalAddress, setOriginalAddress] = useState("");
  const [validatedAddress, setValidatedAddress] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const popup = usePopup();

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/business-settings");
        if (res.ok) {
          const data = await res.json();
          const val = data.location_address || "";
          setAddress(val);
          setOriginalAddress(val);
          if (val) {
            setValidatedAddress(val);
          }
        }
      } catch (err) {
        console.error("Failed to fetch location settings", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleValidate = async () => {
    if (!address.trim()) {
      setErrorMsg("Por favor, ingresá una dirección.");
      setValidatedAddress(null);
      return;
    }

    setValidating(true);
    setErrorMsg(null);
    setValidatedAddress(null);

    try {
      // Query OpenStreetMap Nominatim API with standard headers
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
        {
          headers: {
            "Accept-Language": "es",
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          // Address verified successfully!
          setValidatedAddress(data[0].display_name);
          setErrorMsg(null);
        } else {
          setErrorMsg("No pudimos encontrar esa dirección exacta. Intentá ser más específico (ej: Calle Nro, Localidad, Provincia).");
          setValidatedAddress(null);
        }
      } else {
        setErrorMsg("Error al validar con el servidor de mapas. Por favor, intentá de nuevo.");
      }
    } catch {
      setErrorMsg("Error de conexión al validar la dirección.");
    } finally {
      setValidating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/business-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location_address: address.trim() }),
      });

      if (res.ok) {
        popup.open("Ubicación actualizada con éxito", true);
        setTimeout(() => onClose(), 1500);
      } else {
        popup.open("Error al guardar la ubicación", false);
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

  // Construct iframe preview URL
  const previewQuery = address.trim() || "Obelisco, Buenos Aires, Argentina";
  const previewIframeUrl = `https://maps.google.com/maps?q=${encodeURIComponent(previewQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    <>
      <Modal onClose={onClose} size="lg">
        <h2 className="text-2xl font-extrabold text-center bg-gradient-to-r from-[var(--foreground)] via-[var(--foreground)] to-[var(--accent)] bg-clip-text text-transparent tracking-tight mb-6">
          Ubicación del Local
        </h2>

        <div className="space-y-5 px-2 text-left">
          <div>
            <label className="block text-sm font-medium mb-1 text-[var(--foreground)]/80">
              Dirección de la Barbería
            </label>
            <p className="text-xs text-[var(--foreground)]/50 mb-3 leading-relaxed">
              Escribí la calle, número, localidad y provincia para que los clientes te encuentren en el mapa de Google.
            </p>
            <div className="flex gap-2.5">
              <div className="relative flex-1">
                <span className="absolute left-3 top-3 text-[var(--foreground)]/40">
                  <MapPin size={18} />
                </span>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setValidatedAddress(null);
                    setErrorMsg(null);
                  }}
                  className="w-full !bg-[var(--foreground)]/5 !text-[var(--foreground)] !border !border-[var(--foreground)]/10 rounded-xl py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-colors"
                  placeholder="Ej: Italia 1467, Vicente Lopez, Buenos Aires"
                />
              </div>
              <button
                type="button"
                onClick={handleValidate}
                disabled={validating || !address.trim()}
                className="px-4 py-2.5 bg-[var(--foreground)]/10 hover:bg-[var(--foreground)]/15 text-[var(--foreground)] rounded-xl font-semibold text-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {validating ? "Validando..." : "Validar"}
              </button>
            </div>
          </div>

          {/* Validation Feedback */}
          {validatedAddress && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-start gap-2 text-sm text-green-400">
              <span className="mt-0.5 shrink-0 text-green-500">
                <CheckCircle size={16} />
              </span>
              <div>
                <p className="font-semibold">Dirección encontrada y verificada:</p>
                <p className="text-xs text-green-400/80 leading-relaxed mt-0.5">{validatedAddress}</p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2 text-sm text-red-400">
              <span className="mt-0.5 shrink-0 text-red-500">
                <AlertTriangle size={16} />
              </span>
              <p className="leading-relaxed text-xs">{errorMsg}</p>
            </div>
          )}

          {/* Interactive Live Preview */}
          <div className="mt-2">
            <span className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]/55 mb-2.5">
              Previsualización del Mapa ({address.trim() ? "Dirección Ingresada" : "Fallback Genérico"})
            </span>
            <div className="h-48 w-full rounded-xl overflow-hidden border border-[var(--foreground)]/10 shadow-lg relative bg-black/10">
              <iframe
                src={previewIframeUrl}
                className="w-full h-full border-0"
                allowFullScreen
                loading="lazy"
                title="Previsualización del mapa"
              />
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex justify-center pt-6 mt-6 border-t border-[var(--foreground)]/10">
          <div className="w-[200px]">
            <SaveButton
              onClick={handleSave}
              disabled={saving || validating || (address.trim() !== "" && !validatedAddress) || address.trim() === originalAddress.trim()}
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
