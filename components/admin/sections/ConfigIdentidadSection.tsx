"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, Building2, Sparkles, Store, BookOpen, Camera, X } from "lucide-react";
import { ConfigFormSkeleton } from "@/components/loading/Skeleton";
import SaveButton from "@/components/buttons/SaveButton";
import { uploadImage, deleteImage } from "@/lib/repository/storage";
import { useSettingsForm } from "@/lib/hooks/useSettingsForm";
import logoPlaceholder from "@/public/images/logo.png";
import localPlaceholder from "@/public/images/local.webp";

type IdentidadDraft = {
  business_name: string;
  slogan: string;
  story: string;
  business_logo: string | null;
  local_photo: string | null;
  logoPending?: { name: string; size: number } | null;
  photoPending?: { name: string; size: number } | null;
};

export default function ConfigIdentidadSection() {
  const logoFileRef = useRef<File | null>(null);
  const photoFileRef = useRef<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const { draft, setDraft, loading, hasChanges, saving, save, reset } =
    useSettingsForm<IdentidadDraft>({
      pick: (settings) => {
        const storyArray = settings.our_story || [];
        return {
          business_name: settings.business_name || "",
          slogan: settings.slogan || "",
          story: Array.isArray(storyArray) ? storyArray.join("\n\n") : "",
          business_logo: settings.business_logo || null,
          local_photo: settings.local_photo || null,
          logoPending: null,
          photoPending: null,
        };
      },
      toPayload: async (currentDraft) => {
        let updatedLogo = currentDraft.business_logo;
        let updatedPhoto = currentDraft.local_photo;

        if (logoFileRef.current) {
          if (currentDraft.business_logo) {
            await deleteImage("branding", currentDraft.business_logo).catch(() => {});
          }
          updatedLogo = await uploadImage("branding", logoFileRef.current);
          logoFileRef.current = null;
          setLogoPreview(null);
        }

        if (photoFileRef.current) {
          if (currentDraft.local_photo) {
            await deleteImage("local_photos", currentDraft.local_photo).catch(() => {});
          }
          updatedPhoto = await uploadImage("local_photos", photoFileRef.current);
          photoFileRef.current = null;
          setPhotoPreview(null);
        }

        const storyArray = currentDraft.story
          .split("\n\n")
          .map((p) => p.trim())
          .filter((p) => p.length > 0);

        return {
          business_name: currentDraft.business_name,
          slogan: currentDraft.slogan,
          business_logo: updatedLogo || undefined,
          local_photo: updatedPhoto || undefined,
          our_story: storyArray,
        };
      },
    });

  const handleDiscard = () => {
    logoFileRef.current = null;
    photoFileRef.current = null;
    setLogoPreview(null);
    setPhotoPreview(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
    if (photoInputRef.current) photoInputRef.current.value = "";
    reset();
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      logoFileRef.current = file;
      setLogoPreview(URL.createObjectURL(file));
      setDraft((prev) =>
        prev
          ? {
              ...prev,
              logoPending: { name: file.name, size: file.size },
            }
          : null
      );
    }
  };

  const handleCancelLogo = () => {
    logoFileRef.current = null;
    setLogoPreview(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
    setDraft((prev) => (prev ? { ...prev, logoPending: null } : null));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      photoFileRef.current = file;
      setPhotoPreview(URL.createObjectURL(file));
      setDraft((prev) =>
        prev
          ? {
              ...prev,
              photoPending: { name: file.name, size: file.size },
            }
          : null
      );
    }
  };

  const handleCancelPhoto = () => {
    photoFileRef.current = null;
    setPhotoPreview(null);
    if (photoInputRef.current) photoInputRef.current.value = "";
    setDraft((prev) => (prev ? { ...prev, photoPending: null } : null));
  };

  if (loading || !draft) {
    return <ConfigFormSkeleton />;
  }

  const paragraphCount = draft.story
    .split("\n\n")
    .filter((p) => p.trim().length > 0).length;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      className="space-y-6 sm:space-y-8 animate-in fade-in duration-300"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Identidad y marca
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Personalizá el nombre, slogan, logotipo, foto de fachada y la historia de tu negocio
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <button
              type="button"
              onClick={handleDiscard}
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

      {/* 1. Datos Principales (Nombre y Slogan en 2 columnas) */}
      <div className="bg-[var(--foreground)]/5 p-5 sm:p-6 rounded-2xl border border-[var(--foreground)]/10 space-y-4">
        <div className="flex items-center gap-2 text-[var(--accent)] font-bold text-sm tracking-wider">
          <Building2 className="w-4 h-4" />
          <span>Datos principales</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label
              htmlFor="business-name-input"
              className="block text-xs font-semibold text-slate-300 mb-1.5"
            >
              Nombre del local <span className="text-[var(--accent)]">*</span>
            </label>
            <input
              id="business-name-input"
              type="text"
              value={draft.business_name}
              onChange={(e) =>
                setDraft((prev) => (prev ? { ...prev, business_name: e.target.value } : null))
              }
              placeholder="Ej: Barbería Hooligans"
              required
              className="w-full p-2.5 rounded-xl border border-[var(--foreground)]/15 bg-[var(--background)] text-sm text-[var(--foreground)] focus:border-[var(--accent)] outline-none transition-all"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Nombre público visible en títulos, comprobantes y mensajes
            </p>
          </div>

          <div>
            <label
              htmlFor="business-slogan-input"
              className="block text-xs font-semibold text-slate-300 mb-1.5"
            >
              Slogan
            </label>
            <input
              id="business-slogan-input"
              type="text"
              value={draft.slogan}
              onChange={(e) =>
                setDraft((prev) => (prev ? { ...prev, slogan: e.target.value } : null))
              }
              placeholder="Ej: Corte clásico y estilo masculino"
              className="w-full p-2.5 rounded-xl border border-[var(--foreground)]/15 bg-[var(--background)] text-sm text-[var(--foreground)] focus:border-[var(--accent)] outline-none transition-all"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Frase distintiva o lema que acompaña al nombre
            </p>
          </div>
        </div>
      </div>

      {/* 2. Recursos Visuales (Logotipo y Foto del local en 2 columnas equilibradas) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contenedor: Logotipo del negocio */}
        <div
          className={`bg-[var(--foreground)]/5 p-5 sm:p-6 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
            isDraggingLogo
              ? "border-[var(--accent)] bg-[var(--accent)]/5 scale-[1.005]"
              : "border-[var(--foreground)]/10"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingLogo(true);
          }}
          onDragLeave={() => setIsDraggingLogo(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDraggingLogo(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              const file = e.dataTransfer.files[0];
              logoFileRef.current = file;
              setLogoPreview(URL.createObjectURL(file));
              setDraft((prev) =>
                prev
                  ? {
                      ...prev,
                      logoPending: { name: file.name, size: file.size },
                    }
                  : null
              );
            }
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 text-[var(--accent)] font-bold text-sm tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Logotipo del negocio</span>
              </div>
              <span className="text-[10px] font-medium tracking-wide px-2 py-0.5 rounded-full bg-[var(--foreground)]/10 text-slate-300 border border-[var(--foreground)]/10">
                Navbar y marca
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Identificador gráfico principal en la barra superior, favicon y comprobantes.
            </p>

            {/* Zona de Preview y Controles */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-4 rounded-xl bg-[var(--background)]/60 border border-[var(--foreground)]/10">
              {/* Preview del Logo */}
              <div
                onClick={() => logoInputRef.current?.click()}
                className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-[var(--accent)]/40 bg-[linear-gradient(45deg,#1e293b_25%,transparent_25%),linear-gradient(-45deg,#1e293b_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1e293b_75%),linear-gradient(-45deg,transparent_75%,#1e293b_75%)] bg-[size:10px_10px] bg-[#0f172a] shadow-lg flex-shrink-0 relative group cursor-pointer"
                title="Hacé click para cambiar el logotipo"
              >
                <Image
                  src={logoPreview || draft.business_logo || logoPlaceholder}
                  alt="Logo del negocio"
                  width={96}
                  height={96}
                  className="w-full h-full object-contain p-1.5 transition-transform group-hover:scale-105 duration-200"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-medium gap-1">
                  <Camera className="w-4 h-4 text-[var(--accent)]" />
                  <span>Cambiar</span>
                </div>
              </div>

              {/* Acciones y Especificaciones */}
              <div className="flex-1 space-y-3 w-full">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg !bg-white/5 !text-slate-200 hover:!text-white !border !border-[var(--foreground)]/20 hover:!border-[var(--accent)]/50 transition-all cursor-pointer text-xs font-semibold"
                  >
                    <Upload className="w-3.5 h-3.5 text-[var(--accent)]" />
                    {draft.logoPending ? "Cambiar archivo" : "Subir nuevo logo"}
                  </button>

                  {draft.logoPending && (
                    <button
                      type="button"
                      onClick={handleCancelLogo}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Quitar archivo seleccionado"
                    >
                      <X className="w-3.5 h-3.5" />
                      Quitar archivo
                    </button>
                  )}
                </div>

                {draft.logoPending ? (
                  <div className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1.5 rounded-lg flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                    <span className="truncate max-w-[200px] font-medium">{draft.logoPending.name}</span>
                    <span className="text-slate-400 text-[10px]">
                      ({(draft.logoPending.size / 1024).toFixed(0)} KB)
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1 text-[11px] text-slate-400">
                    <p className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-[var(--accent)]" />
                      Formato PNG o WEBP con fondo transparente
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-[var(--accent)]" />
                      Proporción 1:1 recomendada (ej: 512×512 px)
                    </p>
                  </div>
                )}

                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/webp,image/svg+xml,image/jpeg"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Contenedor: Foto del local / Fachada */}
        <div
          className={`bg-[var(--foreground)]/5 p-5 sm:p-6 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
            isDraggingPhoto
              ? "border-[var(--accent)] bg-[var(--accent)]/5 scale-[1.005]"
              : "border-[var(--foreground)]/10"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingPhoto(true);
          }}
          onDragLeave={() => setIsDraggingPhoto(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDraggingPhoto(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              const file = e.dataTransfer.files[0];
              photoFileRef.current = file;
              setPhotoPreview(URL.createObjectURL(file));
              setDraft((prev) =>
                prev
                  ? {
                      ...prev,
                      photoPending: { name: file.name, size: file.size },
                    }
                  : null
              );
            }
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 text-[var(--accent)] font-bold text-sm tracking-wider">
                <Store className="w-4 h-4" />
                <span>Foto del local o fachada</span>
              </div>
              <span className="text-[10px] font-medium tracking-wide px-2 py-0.5 rounded-full bg-[var(--foreground)]/10 text-slate-300 border border-[var(--foreground)]/10">
                Sobre nosotros
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Imagen de las instalaciones visible en la sección Sobre Nosotros y la reserva de turnos.
            </p>

            {/* Zona de Preview y Controles */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-4 rounded-xl bg-[var(--background)]/60 border border-[var(--foreground)]/10">
              {/* Preview de la Foto (aspect 16:9) */}
              <div
                onClick={() => photoInputRef.current?.click()}
                className="w-full sm:w-44 h-28 rounded-xl overflow-hidden border border-[var(--foreground)]/20 bg-[var(--background)] shadow-lg flex-shrink-0 relative group cursor-pointer"
                title="Hacé click para cambiar la foto del local"
              >
                <Image
                  src={photoPreview || draft.local_photo || localPlaceholder}
                  alt="Fachada del local"
                  fill
                  className="object-cover transition-transform group-hover:scale-105 duration-200"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-medium gap-1">
                  <Camera className="w-4 h-4 text-[var(--accent)]" />
                  <span>Cambiar</span>
                </div>
              </div>

              {/* Acciones y Especificaciones */}
              <div className="flex-1 space-y-3 w-full">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg !bg-white/5 !text-slate-200 hover:!text-white !border !border-[var(--foreground)]/20 hover:!border-[var(--accent)]/50 transition-all cursor-pointer text-xs font-semibold"
                  >
                    <Upload className="w-3.5 h-3.5 text-[var(--accent)]" />
                    {draft.photoPending ? "Cambiar archivo" : "Subir nueva foto"}
                  </button>

                  {draft.photoPending && (
                    <button
                      type="button"
                      onClick={handleCancelPhoto}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Quitar archivo seleccionado"
                    >
                      <X className="w-3.5 h-3.5" />
                      Quitar archivo
                    </button>
                  )}
                </div>

                {draft.photoPending ? (
                  <div className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1.5 rounded-lg flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                    <span className="truncate max-w-[200px] font-medium">{draft.photoPending.name}</span>
                    <span className="text-slate-400 text-[10px]">
                      ({(draft.photoPending.size / 1024).toFixed(0)} KB)
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1 text-[11px] text-slate-400">
                    <p className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-[var(--accent)]" />
                      Formato panorámico 16:9 recomendado
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-[var(--accent)]" />
                      Recomendado 1200×675 px (WEBP o JPG)
                    </p>
                  </div>
                )}

                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Nuestra Historia */}
      <div className="bg-[var(--foreground)]/5 p-5 sm:p-6 rounded-2xl border border-[var(--foreground)]/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[var(--accent)] font-bold text-sm tracking-wider">
            <BookOpen className="w-4 h-4" />
            <span>Nuestra historia</span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            {paragraphCount} {paragraphCount === 1 ? "párrafo" : "párrafos"}
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Contá la historia, pasión y valores de tu negocio. Separá los párrafos dejando una línea en blanco entre ellos.
        </p>
        <textarea
          rows={5}
          value={draft.story}
          onChange={(e) =>
            setDraft((prev) => (prev ? { ...prev, story: e.target.value } : null))
          }
          placeholder="Escribí aquí la historia y la pasión de tu barbería..."
          className="w-full p-3.5 rounded-xl border border-[var(--foreground)]/15 bg-[var(--background)] text-sm text-[var(--foreground)] focus:border-[var(--accent)] outline-none transition-all resize-y leading-relaxed"
        />
      </div>

      {(draft.logoPending || draft.photoPending) && (
        <div className="pt-2">
          <p className="text-xs text-amber-300/90 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Hay imágenes seleccionadas listas para guardar
          </p>
        </div>
      )}
    </form>
  );
}
