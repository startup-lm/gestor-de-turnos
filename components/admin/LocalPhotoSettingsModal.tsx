"use client";

import { useState, useEffect, useRef } from "react";
import Modal from "@/components/ui/Modal";
import { usePopup } from "@/lib/hooks/usePopup";
import PopupModal from "@/components/ui/PopupModal";
import Spinner from "@/components/loading/Spinner";
import { uploadImage, deleteImage } from "@/lib/repository/storage";
import { Upload } from "lucide-react";
import Image from "next/image";
import local from "@/public/images/local.png";
import SaveButton from "@/components/buttons/SaveButton";

interface Props {
  onClose: () => void;
}

export default function LocalPhotoSettingsModal({ onClose }: Readonly<Props>) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(null);
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
          setCurrentPhoto(data.local_photo || null);
        }
      } catch (err) {
        console.error("Failed to fetch local photo settings", err);
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
    let uploadedUrl = currentPhoto;

    try {
      // 1. If a new file is selected, upload it
      if (selectedFile) {
        uploadedUrl = await uploadImage("barbers", selectedFile);
        
        // Delete previous custom image from storage if it existed
        if (currentPhoto) {
          try {
            await deleteImage("barbers", currentPhoto);
          } catch (e) {
            console.error("Error deleting old storefront image", e);
          }
        }
      }

      // 2. Update settings in database
      const res = await fetch("/api/business-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ local_photo: uploadedUrl }),
      });

      if (res.ok) {
        popup.open("Foto del local actualizada con éxito", true);
        setTimeout(() => onClose(), 1500);
      } else {
        popup.open("Error al guardar la foto", false);
      }
    } catch {
      popup.open("Error al subir la imagen", false);
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
        <h2 className="text-2xl font-extrabold text-center bg-gradient-to-r from-[var(--foreground)] via-[var(--foreground)] to-[var(--accent)] bg-clip-text text-transparent tracking-tight mb-6">
          Foto del Local
        </h2>

        <div className="space-y-5 px-2 text-left">
          <p className="text-sm text-[var(--foreground)]/50 mb-2 leading-relaxed">
            Subí una foto de la fachada o del interior de tu barbería. Se mostrará en la sección &quot;¿Dónde Estamos?&quot; junto al mapa.
          </p>

          {/* Current / Preview Image Display */}
          <div className="flex flex-col items-center">
            <span className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]/55 self-start mb-2">
              Vista previa
            </span>
            <div className="relative h-56 w-full rounded-2xl overflow-hidden border border-[var(--foreground)]/10 shadow-lg bg-black/10 flex items-center justify-center">
              {previewUrl ? (
                // Selected file preview
                <img
                  src={previewUrl}
                  alt="Vista previa"
                  className="h-full w-full object-cover"
                />
              ) : currentPhoto ? (
                // Loaded dynamic photo from database
                <Image
                  src={currentPhoto}
                  alt="Foto del local"
                  fill
                  className="object-cover"
                  sizes="(max-width:768px) 100vw, 400px"
                />
              ) : (
                // Fallback default image
                <div className="relative w-full h-full group">
                  <Image
                    src={local}
                    alt="Foto por defecto"
                    fill
                    className="object-cover opacity-80"
                    sizes="(max-width:768px) 100vw, 400px"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-xs bg-black/50 px-3 py-1.5 rounded-full text-white font-medium">
                      Mostrando imagen por defecto
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Upload Button */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <div
              role="button"
              onClick={triggerFileInput}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-dashed border-slate-700 hover:border-[var(--accent)]/40 rounded-xl bg-slate-950/40 hover:bg-[#131c33] text-sm font-semibold transition-all group text-slate-200 cursor-pointer"
            >
              <Upload size={18} className="text-slate-400 group-hover:text-[var(--accent)] transition-colors" />
              <span>{selectedFile ? "Cambiar archivo seleccionado" : "Subir nueva foto"}</span>
            </div>
            {selectedFile && (
              <p className="text-xs text-green-400 mt-2 text-center font-medium">
                ✓ Listo para subir: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex justify-center pt-6 mt-6 border-t border-[var(--foreground)]/10">
          <div className="w-[200px]">
            <SaveButton
              onClick={handleSave}
              disabled={saving || !selectedFile}
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
