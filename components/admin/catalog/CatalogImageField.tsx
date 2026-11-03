"use client";

import Image from "next/image";
import { Upload } from "lucide-react";
import logo from "@/public/images/logo.png";

interface Props {
  label: string;
  /** Imagen ya guardada (al editar) */
  currentImage?: string;
  /** Vista previa del archivo recién elegido */
  preview: string | null;
  fileName?: string;
  onSelect: (file: File) => void;
}

/** Selector de foto de productos y servicios, con vista previa */
export default function CatalogImageField({ label, currentImage, preview, fileName, onSelect }: Readonly<Props>) {
  const src = preview || currentImage;

  return (
    <div className="p-6 rounded-2xl border border-[var(--foreground)]/10 bg-gradient-to-b from-[var(--foreground)]/5 to-[var(--foreground)]/2 backdrop-blur-md flex flex-col h-full">
      <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-3">
        {label}
      </label>

      <div className="relative w-full h-[280px] lg:h-auto lg:flex-1 min-h-[240px] rounded-2xl overflow-hidden border-2 border-dashed border-[var(--foreground)]/15 hover:border-[var(--accent)]/50 transition-colors bg-[var(--background)]/50 flex flex-col items-center justify-center group cursor-pointer">
        {src ? (
          <>
            <Image src={src} alt={label} fill className="object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
              <Upload className="w-8 h-8 text-[var(--accent)] mb-2" />
              <span className="text-xs font-semibold text-white">{fileName || "Hacé clic para cambiar la foto"}</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <Image src={logo} alt="" width={64} height={64} className="opacity-20 mb-3" />
            <span className="text-sm font-semibold text-[var(--foreground)]">Seleccionar foto</span>
            <span className="text-xs text-[var(--foreground)]/40 mt-1">PNG, JPG o WEBP (máx. 4MB)</span>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onSelect(file);
          }}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>

      <p className="text-[11px] text-[var(--foreground)]/40 text-center mt-3">
        Recomendado: fondo neutro, proporción 1:1
      </p>
    </div>
  );
}
