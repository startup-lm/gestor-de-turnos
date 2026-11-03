"use client";

import React from "react";
import { Loader2 } from "lucide-react";

export interface ActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  name: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  loadingIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  loading?: boolean;
  buttonClass?: string;
  hideLabel?: boolean; // 👈 NUEVO
}

export function ActionButton({
  name,
  Icon,
  loadingIcon: LoadingIcon = Loader2,
  loading = false,
  disabled = false,
  className = "",
  buttonClass = "!bg-[var(--accent)] hover:!bg-[var(--accent-hover)] !text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-md shadow-[var(--accent)]/15 border border-[var(--accent)]/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
  hideLabel = false,
  ...rest
}: Readonly<ActionButtonProps>) {
  return (
    <button
      type="button"
      aria-label={name}
      disabled={disabled}
      className={`inline-flex items-center justify-center text-center ${buttonClass} ${className}`}
      {...rest}
    >
      {loading ? (
        <LoadingIcon className={`w-5 h-5 animate-spin ${hideLabel ? "" : "mr-1.5"}`} />
      ) : (
        <Icon className={`w-5 h-5 ${hideLabel ? "" : "mr-1.5"}`} />
      )}
      {!hideLabel && <span>{name}</span>}
    </button>
  );
}
