"use client";

import React from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import { Barber } from "@/lib/types/Barbers";
import logo from "@/public/images/logo.png";

interface Props {
  barbers: Barber[];
  selectedBarberId: number | null;
  onChange: (id: number) => void;
}

export default function BarberCheckbox({ barbers, selectedBarberId, onChange }: Readonly<Props>) {
  return (
    <div className="flex flex-wrap justify-center gap-6 py-2">
      {barbers.map((b) => {
        const isSelected = b.id === selectedBarberId;
        return (
          <button
            key={b.id}
            type="button"
            onClick={() => onChange(b.id!)}
            data-testid={`barber-checkbox-${b.id}`}
            className={`w-36 h-36 barber-checkbox ${isSelected ? "selected" : ""}`}
            aria-checked={isSelected}
            role="checkbox"
          >
            {/* Contenedor del Avatar Circular */}
            <div className="relative mb-3">
              <div 
                className={`w-20 h-20 rounded-full p-[2px] transition-all duration-300 ${
                  isSelected 
                    ? "ring-4 ring-[var(--accent)] ring-offset-4 ring-offset-[var(--background)] shadow-[0_0_20px_rgba(223,186,115,0.4)]" 
                    : "ring-2 ring-[var(--accent)]/20 hover:ring-[var(--accent)]/50"
                }`}
              >
                <Image
                  src={b.image || logo}
                  alt={b.name}
                  width={80}
                  height={80}
                  className="w-full h-full rounded-full object-cover bg-[var(--background)] border border-[var(--foreground)]/10"
                />
              </div>

              {/* Badge de Selección (Check) */}
              {isSelected && (
                <div 
                  className="absolute -top-1 -right-1 bg-[var(--accent)] text-[var(--background)] rounded-full p-1 shadow-lg animate-scale-in"
                  style={{ animation: "scaleIn 200ms ease-out forwards" }}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                </div>
              )}
            </div>

            {/* Nombre del Barbero */}
            <span 
              className={`text-sm font-semibold tracking-wide transition-colors duration-200 ${
                isSelected ? "text-[var(--accent)]" : "text-[var(--foreground)]/80"
              }`}
            >
              {b.name}
            </span>
          </button>
        );
      })}

      {/* Definición de animación rápida en línea */}
      <style jsx global>{`
        @keyframes scaleIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}