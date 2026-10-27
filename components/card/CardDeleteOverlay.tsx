"use client";

import React from "react";
import { Trash2, Loader2 } from "lucide-react";

interface CardDeleteOverlayProps {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  loadingText?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function CardDeleteOverlay({
  title = "¿Eliminar este elemento?",
  description = "Esta acción no se puede deshacer.",
  confirmText = "Eliminar",
  cancelText = "Cancelar",
  loadingText = "Eliminando...",
  loading = false,
  onConfirm,
  onCancel,
}: Readonly<CardDeleteOverlayProps>) {
  return (
    <div
      className="absolute inset-0 z-20 bg-[var(--background)]/95 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center rounded-2xl border border-red-500/30 animate-in fade-in duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-3 shadow-lg shadow-red-500/5">
        <Trash2 className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-bold text-[var(--foreground)] mb-1 leading-snug">{title}</h4>
      <p className="text-xs text-[var(--foreground)]/60 mb-5 leading-relaxed">{description}</p>
      <div className="flex gap-2 w-full">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 py-2 px-3 text-xs font-semibold rounded-lg border border-[var(--foreground)]/10 text-[var(--foreground)]/80 hover:bg-[var(--foreground)]/5 transition-colors cursor-pointer disabled:opacity-50"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 py-2 px-3 text-xs font-semibold rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors cursor-pointer shadow-md shadow-red-500/20 disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-inherit" />
          ) : (
            confirmText
          )}
        </button>
      </div>
    </div>
  );
}
