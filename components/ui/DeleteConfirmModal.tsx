"use client";

import React, { useEffect } from "react";
import { Trash2, Loader2 } from "lucide-react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "¿Eliminar este elemento?",
  description = "Esta acción no se puede deshacer.",
  confirmText = "Eliminar",
  cancelText = "Cancelar",
  loading = false,
}: Readonly<DeleteConfirmModalProps>) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => {
        if (!loading) onClose();
      }}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-red-500/30 bg-[var(--background)]/95 backdrop-blur-md p-6 md:p-7 flex flex-col items-center justify-center text-center shadow-2xl shadow-black/80 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4 shadow-lg shadow-red-500/10">
          <Trash2 className="w-7 h-7" />
        </div>

        <h3 className="text-base md:text-lg font-bold text-[var(--foreground)] mb-1.5 leading-snug">
          {title}
        </h3>

        <p className="text-xs md:text-sm text-[var(--foreground)]/65 mb-6 leading-relaxed max-w-xs">
          {description}
        </p>

        <div className="flex items-center gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 px-4 text-xs md:text-sm font-semibold rounded-xl border border-[var(--foreground)]/10 text-[var(--foreground)]/80 hover:bg-[var(--foreground)]/5 transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 px-4 text-xs md:text-sm font-semibold rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all cursor-pointer shadow-md shadow-red-500/20 disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-inherit" />
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
