"use client";

import Image from "next/image";
import HeroActions from "./HeroActions";
import homeBg from "@/public/images/home.jpg";
import { useBusinessContext } from "@/lib/context/BusinessContext";

export default function Hero() {
  const { businessSettings } = useBusinessContext();
  const name = businessSettings?.business_name || "Barbería Premium";
  const words = name.trim().split(/\s+/);
  
  let firstPart = "";
  let lastWord = "";
  if (words.length > 1) {
    lastWord = words.pop() || "";
    firstPart = words.join(" ");
  } else {
    lastWord = words[0] || "";
    firstPart = "";
  }

  return (
    <section className="relative min-h-[440px] sm:min-h-[480px] flex items-center justify-center text-center overflow-hidden rounded-3xl border border-slate-800/60 shadow-2xl">
      {/* Background Image with dark-gold gradient overlay */}
      <Image
        src={homeBg}
        alt="Barbería fondo"
        fill
        className="object-cover object-top sm:object-center filter brightness-[0.25] transition-transform duration-[10000ms] ease-out hover:scale-105"
        priority
        sizes="(max-width:768px) 100vw, 1200px"
      />
      
      {/* High-fidelity color mesh overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-[#050811]/70 to-[#050811] z-0 pointer-events-none" />

      {/* Decorative top gold indicator */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full border border-[var(--accent)]/30 bg-slate-950/60 backdrop-blur-md z-10 flex items-center gap-1.5 pointer-events-none">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-ping" />
        <span className="text-[10px] font-bold tracking-[0.2em] text-[var(--accent)] uppercase">Abierto Ahora</span>
      </div>

      <div className="relative z-10 space-y-6 px-6 max-w-2xl py-12">
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-none">
            {firstPart}{firstPart ? " " : ""}
            <span className="bg-gradient-to-r from-[var(--accent)] via-[#fcebb6] to-[var(--accent)] bg-clip-text text-transparent">
              {lastWord}
            </span>
          </h1>
          <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent mx-auto my-3" />
          <p className="text-base sm:text-lg text-slate-300 font-medium tracking-wide max-w-md mx-auto leading-relaxed">
            Corte, afeitado tradicional y estilo diseñado para el caballero moderno. Reservá tu turno de forma ágil y cómoda.
          </p>
        </div>

        <HeroActions />
      </div>
    </section>
  );
}
