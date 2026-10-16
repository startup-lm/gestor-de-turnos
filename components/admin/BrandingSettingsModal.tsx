"use client";

import { useState, useEffect, useRef } from "react";
import Modal from "@/components/ui/Modal";
import { usePopup } from "@/lib/hooks/usePopup";
import PopupModal from "@/components/ui/PopupModal";
import Spinner from "@/components/loading/Spinner";
import { uploadImage, deleteImage } from "@/lib/repository/storage";
import { Upload } from "lucide-react";
import Image from "next/image";
import logo from "@/public/images/logo.png";
import SaveButton from "@/components/buttons/SaveButton";
import { useBusinessContext } from "@/lib/context/BusinessContext";

interface Props {
  onClose: () => void;
}

export default function BrandingSettingsModal({ onClose }: Readonly<Props>) {
  const { refreshConfig } = useBusinessContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [businessName, setBusinessName] = useState("");
  const [originalBusinessName, setOriginalBusinessName] = useState("");
  
  const [slogan, setSlogan] = useState("");
  const [originalSlogan, setOriginalSlogan] = useState("");
  
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const popup = usePopup();

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/business-settings");
        if (res.ok) {
          const data = await res.json();
          const nameVal = data.business_name || "";
          const sloganVal = data.slogan || "";
          const logoVal = data.business_logo || null;
          
          setBusinessName(nameVal);
          setOriginalBusinessName(nameVal);
          setSlogan(sloganVal);
          setOriginalSlogan(sloganVal);
          setCurrentLogo(logoVal);
        }
      } catch (err) {
        console.error("Failed to fetch branding settings", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSave = async () => {
    setSaving(true);
    let uploadedLogoUrl = currentLogo;

    try {
      // 1. If a new logo file is selected, upload it
      if (selectedFile) {
        uploadedLogoUrl = await uploadImage("barbers", selectedFile);
        
        // If there was a previous custom logo, delete it from storage
        if (currentLogo) {
          try {
            await deleteImage("barbers", currentLogo);
          } catch (e) {
            console.error("Error deleting old logo image", e);
          }
        }
      }

      // 2. Save in database
      const res = await fetch("/api/business-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          business_name: businessName.trim() || "Barbería Premium", 
          slogan: slogan.trim() || null,
          business_logo: uploadedLogoUrl 
        }),
      });

      if (res.ok) {
        // Refresh the global business configuration context
        await refreshConfig();
        popup.open("Identidad de marca actualizada con éxito", true);
        setTimeout(() => onClose(), 1500);
      } else {
        popup.open("Error al guardar la configuración", false);
      }
    } catch (err) {
      console.error(err);
      popup.open("Error al conectar con el servidor", false);
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = businessName !== originalBusinessName || slogan !== originalSlogan || selectedFile !== null;

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
        <h2 className="text-2xl font-extrabold text-center bg-gradient-to-r from-[var(--foreground)] via-[var(--foreground)] to-[var(--accent)] bg-clip-text text-transparent tracking-tight mb-6">
          Identidad de Marca
        </h2>

        <div className="space-y-6 px-2 text-left">
          <p className="text-sm text-[var(--foreground)]/50 mb-2 leading-relaxed">
            Personalizá el nombre, el slogan y el logo principal de tu negocio. Estos cambios se verán reflejados al instante en todo el sitio web.
          </p>

          {/* Business Name Field */}
          <div>
            <label htmlFor="branding-settings-name" className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-2">
              Nombre Comercial del Local
            </label>
            <div className="relative">
              <input
                id="branding-settings-name"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Ej. Barbería Premium"
                className="w-full bg-slate-950/40 border border-slate-700 focus:border-[var(--accent)]/50 focus:outline-none py-2.5 px-4 rounded-lg text-sm text-[var(--foreground)] transition-all"
              />
            </div>
          </div>

          {/* Slogan Field */}
          <div>
            <label htmlFor="branding-settings-slogan" className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-2">
              Slogan o Frase de Portada
            </label>
            <div className="relative">
              <input
                id="branding-settings-slogan"
                type="text"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                placeholder="Ej. 100% CALAMAR (opcional)"
                className="w-full bg-slate-950/40 border border-slate-700 focus:border-[var(--accent)]/50 focus:outline-none py-2.5 px-4 rounded-lg text-sm text-[var(--foreground)] transition-all"
              />
            </div>
            <p className="text-[11px] text-[var(--foreground)]/40 mt-1.5">
              Frase destacada en la portada principal. Si lo dejás vacío, se usará el texto institucional por defecto.
            </p>
          </div>

          {/* Business Logo Field */}
          <div className="flex flex-col items-center">
            <span className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]/55 self-start mb-2">
              Logo del Local
            </span>
            
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-[var(--foreground)]/10 shadow-lg bg-black/20 flex items-center justify-center mb-4">
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt="Vista previa logo"
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : currentLogo ? (
                <Image
                  src={currentLogo}
                  alt="Logo del negocio"
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              ) : (
                <div className="relative w-full h-full">
                  <Image
                    src={logo}
                    alt="Logo por defecto"
                    fill
                    className="object-cover opacity-80"
                    sizes="128px"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-center p-1">
                    <span className="text-[10px] bg-black/50 px-2 py-1 rounded-full text-white font-medium">
                      Por defecto
                    </span>
                  </div>
                </div>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            
            <button
              type="button"
              onClick={triggerFileInput}
              className="w-[200] flex items-center justify-center gap-2 py-3 px-4 border border-dashed border-slate-700 hover:border-[var(--accent)]/40 rounded-xl bg-slate-950/40 hover:bg-[#131c33] text-sm font-semibold transition-all group text-slate-200 cursor-pointer"
            >
              <Upload size={18} className="text-slate-400 group-hover:text-[var(--accent)] transition-colors" />
              <span>{selectedFile ? "Cambiar logo" : "Subir logo"}</span>
            </button>
            
            {selectedFile && (
              <p className="text-xs text-green-400 mt-2 text-center font-medium">
                ✓ Listo para subir: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex justify-center pt-6 mt-6 border-t border-[var(--foreground)]/10">
            <div className="w-[200px]">
              <SaveButton
                onClick={handleSave}
                disabled={saving || !hasChanges}
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
