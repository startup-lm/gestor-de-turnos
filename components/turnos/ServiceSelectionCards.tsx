"use client";

import React from "react";
import Image from "next/image";
import { Clock, Scissors, Check } from "lucide-react";
import { Service } from "@/lib/types/Services";
import logo from "@/public/images/logo.png";

interface Props {
  services: Service[];
  selectedServiceId: number | null;
  onSelectService: (service: Service) => void;
}

export default function ServiceSelectionCards({
  services,
  selectedServiceId,
  onSelectService,
}: Readonly<Props>) {
  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] text-xs font-semibold mb-3">
          <span>Paso 1 de 3</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
          ¿Qué servicio te gustaría realizarte?
        </h2>
        <p className="text-sm md:text-base text-[var(--foreground)]/60 mt-2 max-w-md mx-auto">
          Elegí la opción que estás buscando para ver la disponibilidad de profesionales y horarios.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => {
          const isSelected = selectedServiceId === service.id;
          return (
            <div
              key={service.id}
              onClick={() => onSelectService(service)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectService(service);
                }
              }}
              tabIndex={0}
              role="button"
              aria-pressed={isSelected}
              className={`group relative flex flex-col justify-between rounded-2xl p-5 transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-md border ${
                isSelected
                  ? "bg-gradient-to-b from-[var(--accent)]/15 to-[var(--background)] border-[var(--accent)] shadow-[0_0_25px_rgba(223,186,115,0.25)] scale-[1.02]"
                  : "bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/8 border-[var(--foreground)]/10 hover:border-[var(--accent)]/40 hover:shadow-xl hover:shadow-[var(--accent)]/5 hover:-translate-y-1"
              }`}
            >
              {/* Badge Check si está seleccionado */}
              {isSelected && (
                <div className="absolute top-4 right-4 z-20 bg-[var(--accent)] text-[var(--background)] rounded-full p-1.5 shadow-lg">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              )}

              {/* Imagen del servicio */}
              <div className="relative w-full h-44 mb-4 rounded-xl overflow-hidden border border-[var(--foreground)]/10 shadow-inner bg-[var(--background)]">
                <Image
                  src={service.image || logo}
                  alt={service.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 350px"
                  className={`transition-transform duration-500 group-hover:scale-105 ${
                    !service.image ? "object-contain p-6" : "object-cover"
                  }`}
                  priority
                />
                {/* Duración pill sobre la foto */}
                <div className="absolute bottom-2.5 right-2.5 z-10 bg-black/75 backdrop-blur-md text-white text-xs font-semibold px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1.5 shadow-md">
                  <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>{service.duration || 30} min</span>
                </div>
              </div>

              {/* Contenido */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors tracking-wide mb-1.5">
                    {service.name}
                  </h3>
                  <p className="text-xs md:text-sm text-[var(--foreground)]/70 line-clamp-2 leading-relaxed min-h-[38px] mb-4">
                    {service.description || "Servicio profesional de barbería y estilismo."}
                  </p>
                </div>

                <div className="pt-4 border-t border-[var(--foreground)]/10 flex items-center justify-between mt-auto">
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-[var(--foreground)]/40 font-semibold">
                      Precio
                    </span>
                    <span className="text-xl md:text-2xl font-black text-[var(--accent)] tracking-tight">
                      ${service.price.toLocaleString("es-AR")}
                    </span>
                  </div>

                  <span className="text-xs font-bold px-3.5 py-2 rounded-xl bg-[var(--accent)]/10 group-hover:bg-[var(--accent)] text-[var(--accent)] group-hover:text-[var(--background)] border border-[var(--accent)]/20 transition-all duration-300 flex items-center gap-1.5 shadow-sm">
                    <Scissors className="w-3.5 h-3.5" />
                    Elegir
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
