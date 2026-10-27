"use client";

import React from "react";
import Image from "next/image";
import { Scissors, Check, ArrowLeft, Instagram } from "lucide-react";
import { Barber } from "@/lib/types/Barbers";
import logo from "@/public/images/logo.png";

interface Props {
  barbers: Barber[];
  selectedBarberId: number | null;
  onSelectBarber: (id: number) => void;
  onBack: () => void;
  selectedServiceName?: string;
}

export default function BarberSelectionCards({
  barbers,
  selectedBarberId,
  onSelectBarber,
  onBack,
  selectedServiceName,
}: Readonly<Props>) {
  // Barberos activos con ID válido
  const activeBarbers = barbers.filter((b) => b.id !== undefined && b.id > 0);

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in">
      {/* Botón Volver */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs md:text-sm font-bold text-slate-400 hover:text-[var(--accent)] transition-colors duration-200 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Cambiar servicio ({selectedServiceName || "Servicio"})</span>
        </button>
      </div>

      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] text-xs font-semibold mb-3">
          <span>Paso 2 de 3</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
          ¿Con quién te querés atender?
        </h2>
        <p className="text-sm md:text-base text-[var(--foreground)]/60 mt-2 max-w-md mx-auto">
          Elegí a tu barbero de confianza o seleccioná asignación automática para acceder a más horarios libres.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Opción 1: Sin preferencia / Asignación automática */}
        <div
          onClick={() => onSelectBarber(0)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelectBarber(0);
            }
          }}
          tabIndex={0}
          role="button"
          aria-pressed={selectedBarberId === 0}
          className={`barber-checkbox group relative flex flex-col justify-between rounded-2xl p-6 transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-md border ${
            selectedBarberId === 0
              ? "bg-gradient-to-b from-[var(--accent)]/20 via-[var(--foreground)]/5 to-[var(--background)] border-[var(--accent)] shadow-[0_0_25px_rgba(223,186,115,0.3)] scale-[1.02]"
              : "bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/8 border-[var(--accent)]/30 hover:border-[var(--accent)] hover:shadow-xl hover:shadow-[var(--accent)]/10 hover:-translate-y-1"
          }`}
        >
          {selectedBarberId === 0 && (
            <div className="absolute top-4 right-4 z-20 bg-[var(--accent)] text-[var(--background)] rounded-full p-1.5 shadow-lg">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
          )}

          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-[var(--accent)]/15 border-2 border-[var(--accent)]/40 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md">
              <Scissors className="w-9 h-9 text-[var(--accent)]" />
            </div>

            <h3 className="text-lg font-extrabold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
              Cualquier profesional
            </h3>
            <p className="text-xs text-[var(--foreground)]/70 mt-2 leading-relaxed">
              Te asignaremos automáticamente al barbero libre en el día y horario que elijas.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-[var(--foreground)]/10 flex justify-center">
            <span className="text-xs font-bold text-[var(--accent)] group-hover:underline">
              Seleccionar horario libre →
            </span>
          </div>
        </div>

        {/* Barberos individuales */}
        {activeBarbers.map((barber) => {
          const isSelected = selectedBarberId === barber.id;
          return (
            <div
              key={barber.id}
              onClick={() => onSelectBarber(barber.id!)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectBarber(barber.id!);
                }
              }}
              tabIndex={0}
              role="button"
              aria-pressed={isSelected}
              className={`barber-checkbox group relative flex flex-col justify-between rounded-2xl p-6 transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-md border ${
                isSelected
                  ? "bg-gradient-to-b from-[var(--accent)]/15 to-[var(--background)] border-[var(--accent)] shadow-[0_0_25px_rgba(223,186,115,0.25)] scale-[1.02]"
                  : "bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/8 border-[var(--foreground)]/10 hover:border-[var(--accent)]/40 hover:shadow-xl hover:shadow-[var(--accent)]/5 hover:-translate-y-1"
              }`}
            >
              {isSelected && (
                <div className="absolute top-4 right-4 z-20 bg-[var(--accent)] text-[var(--background)] rounded-full p-1.5 shadow-lg">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              )}

              <div className="flex flex-col items-center text-center">
                <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[var(--accent)]/30 group-hover:border-[var(--accent)] group-hover:scale-105 transition-all duration-300 mb-4 shadow-md bg-[var(--background)]">
                  <Image
                    src={barber.image || logo}
                    alt={barber.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>

                <h3 className="text-lg font-extrabold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                  {barber.name}
                </h3>

                {barber.instagram && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-[var(--accent)]">
                    <Instagram className="w-3.5 h-3.5" />
                    <span>@{barber.instagram}</span>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--foreground)]/10 flex justify-center">
                <span className="text-xs font-bold text-[var(--foreground)]/70 group-hover:text-[var(--accent)] transition-colors">
                  Ver agenda de turnos →
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
