"use client";

import React from "react";
import { Loader2, AlertTriangle } from "lucide-react";

interface InlineConfirmProps {
  message: string;
  confirmText: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function InlineConfirm({
  message,
  confirmText,
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  loading = false,
}: Readonly<InlineConfirmProps>) {
  return (
    <div className="w-full rounded-xl border border-red-500/30 bg-red-500/10 p-4 space-y-3 animate-in fade-in duration-200">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs sm:text-sm text-red-200/90 leading-relaxed font-medium">
          {message}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="min-h-[44px] sm:min-h-0 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50 w-full sm:w-auto"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="min-h-[44px] sm:min-h-0 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors cursor-pointer shadow-sm shadow-red-600/30 disabled:opacity-50 inline-flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin text-inherit flex-shrink-0" />}
          <span>{confirmText}</span>
        </button>
      </div>
    </div>
  );
}
