"use client";

import React from "react";
import { Scissors } from "lucide-react";

export interface ActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  name: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  loadingIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  loading?: boolean;
  buttonClass?: string;
}

export function ActionButton({
  name,
  Icon,
  loadingIcon: LoadingIcon = Scissors,
  loading = false,
  disabled = false,
  className = "",
  buttonClass = "btn-home-primary",
  ...rest
}: Readonly<ActionButtonProps>) {
  return (
    <button
      type="button"
      aria-label={name}
      disabled={disabled}
      className={`flex items-center w-full justify-center text-center ${buttonClass} ${className}`}
      {...rest}
    >
      {loading ? (
        <LoadingIcon className="w-5 h-5 animate-spin" />
      ) : (
        <>
          <Icon className="w-5 h-5 mr-1" />
          {name}
        </>
      )}
    </button>
  );
}
