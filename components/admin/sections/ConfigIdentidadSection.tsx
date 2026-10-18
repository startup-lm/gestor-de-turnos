"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Upload } from "lucide-react";
import Spinner from "@/components/loading/Spinner";
import SaveButton from "@/components/buttons/SaveButton";
import { uploadImage, deleteImage } from "@/lib/repository/storage";
import { toast } from "@/lib/store/useToastStore";
import logoPlaceholder from "@/public/images/logo.png";
import localPlaceholder from "@/public/images/local.png";

export default function ConfigIdentidadSection() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [businessName, setBusinessName] = useState("");
  const [slogan, setSlogan] = useState("");
  const [story, setStory] = useState("");

  const [currentLogo, setCurrentLogo] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [currentPhoto, setCurrentPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true);
        const res = await fetch("/api/business-settings");
        if (res.ok) {
          const data = await res.json();
          setBusinessName(data.business_name || "");
          setSlogan(data.slogan || "");
          setCurrentLogo(data.business_logo || null);
          setCurrentPhoto(data.local_photo || null);
          const storyArray = data.our_story || [];
          setStory(Array.isArray(storyArray) ? storyArray.join("\n\n") : "");
        }
      } catch (err) {
        console.error("Error al cargar configuración de identidad:", err);
        toast.error("Error al cargar datos de identidad");
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    let updatedLogo = currentLogo;
    let updatedPhoto = currentPhoto;

    try {
      if (logoFile) {
        if (currentLogo) await deleteImage("branding", currentLogo).catch(() => {});
        updatedLogo = await uploadImage("branding", logoFile);
      }

      if (photoFile) {
        if (currentPhoto) await deleteImage("local_photos", currentPhoto).catch(() => {});
        updatedPhoto = await uploadImage("local_photos", photoFile);
      }

      const storyArray = story
        .split("\n\n")
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      const res = await fetch("/api/business-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: businessName,
          slogan,
          business_logo: updatedLogo,
          local_photo: updatedPhoto,
          our_story: storyArray,
        }),
      });

      if (res.ok) {
        setCurrentLogo(updatedLogo);
        setCurrentPhoto(updatedPhoto);
        setLogoFile(null);
        setPhotoFile(null);
        toast.success("Identidad y marca actualizada con éxito");
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
          Identidad y marca
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Personalizá el nombre, slogan, logo, imagen del local y el texto de historia
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nombre y Slogan */}
        <div className="space-y-4 bg-[var(--foreground)]/5 p-5 rounded-2xl border border-[var(--foreground)]/10">
          <h3 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider text-[var(--accent)]">
            Datos principales
          </h3>
          <div>
            <label htmlFor="business-name-input" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Nombre del local
            </label>
            <input
              id="business-name-input"
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Ej: Barbería Hooligans"
              required
              className="w-full p-2.5 rounded-xl border border-[var(--foreground)]/15 bg-[var(--background)] text-sm text-[var(--foreground)] focus:border-[var(--accent)] outline-none transition-all"
            />
          </div>

          <div>
            <label htmlFor="business-slogan-input" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Slogan
            </label>
            <input
              id="business-slogan-input"
              type="text"
              value={slogan}
              onChange={(e) => setSlogan(e.target.value)}
              placeholder="Ej: Corte clásico y estilo masculino"
              className="w-full p-2.5 rounded-xl border border-[var(--foreground)]/15 bg-[var(--background)] text-sm text-[var(--foreground)] focus:border-[var(--accent)] outline-none transition-all"
            />
          </div>
        </div>

        {/* Logotipo */}
        <div className="space-y-4 bg-[var(--foreground)]/5 p-5 rounded-2xl border border-[var(--foreground)]/10 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider text-[var(--accent)] mb-3">
              Logotipo del negocio
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[var(--accent)]/40 bg-[var(--background)] shadow-inner flex-shrink-0">
                <Image
                  src={logoPreview || currentLogo || logoPlaceholder}
                  alt="Logo"
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg !bg-white/5 !text-slate-200 hover:!text-white !border !border-[var(--foreground)]/20 hover:!border-[var(--accent)]/50 transition-all cursor-pointer text-xs font-semibold"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Cambiar logo
                </button>
                <p className="text-[10px] text-slate-400 mt-1">PNG o WEBP con fondo transparente</p>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Foto del Local */}
      <div className="bg-[var(--foreground)]/5 p-5 rounded-2xl border border-[var(--foreground)]/10 space-y-4">
        <h3 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider text-[var(--accent)]">
          Foto del Local
        </h3>
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <div className="w-full sm:w-48 h-32 rounded-xl overflow-hidden border border-[var(--foreground)]/15 bg-[var(--background)] relative flex-shrink-0">
            <Image
              src={photoPreview || currentPhoto || localPlaceholder}
              alt="Fachada del local"
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-xs text-slate-300">
              Esta foto se muestra en la sección de Sobre Nosotros y en la cabecera informativa de clientes.
            </p>
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl !bg-white/5 !text-slate-200 hover:!text-white !border !border-[var(--foreground)]/20 hover:!border-[var(--accent)]/50 transition-all cursor-pointer text-xs font-semibold"
            >
              <Upload className="w-4 h-4" />
              Subir nueva foto
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Nuestra Historia */}
      <div className="bg-[var(--foreground)]/5 p-5 rounded-2xl border border-[var(--foreground)]/10 space-y-3">
        <h3 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider text-[var(--accent)]">
          Nuestra historia
        </h3>
        <p className="text-xs text-slate-400">
          Separá los párrafos dejando una línea en blanco entre ellos.
        </p>
        <textarea
          rows={5}
          value={story}
          onChange={(e) => setStory(e.target.value)}
          placeholder="Escribí aquí la historia y la pasión de tu barbería..."
          className="w-full p-3 rounded-xl border border-[var(--foreground)]/15 bg-[var(--background)] text-sm text-[var(--foreground)] focus:border-[var(--accent)] outline-none transition-all resize-y"
        />
      </div>

      <div className="flex justify-end pt-2">
        <SaveButton type="submit" loading={saving} disabled={saving} />
      </div>
    </form>
  );
}
