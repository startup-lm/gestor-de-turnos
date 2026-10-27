"use client";

import { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { useToastStore, ToastItem } from "@/lib/store/useToastStore";

function ToastNotification({ item, onClose }: Readonly<{ item: ToastItem; onClose: () => void }>) {
  useEffect(() => {
    if (item.duration && item.duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, item.duration);
      return () => clearTimeout(timer);
    }
  }, [item.duration, onClose]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-[var(--accent)] flex-shrink-0" />,
  };

  const borderStyles = {
    success: "border-emerald-500/30 shadow-emerald-500/5",
    error: "border-rose-500/30 shadow-rose-500/5",
    info: "border-[var(--accent)]/30 shadow-[var(--accent)]/5",
  };

  return (
    <div
      role="alert"
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl bg-[#0B132B]/95 backdrop-blur-md border shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${borderStyles[item.type]}`}
    >
      <div className="mt-0.5">{icons[item.type]}</div>
      <p className="flex-1 text-sm font-medium text-slate-200 leading-snug whitespace-pre-line">
        {item.message}
      </p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar notificación"
        className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5 -mr-1 -mt-1 cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[99999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((item) => (
        <ToastNotification
          key={item.id}
          item={item}
          onClose={() => removeToast(item.id)}
        />
      ))}
    </div>
  );
}
