"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Clock } from "lucide-react";
import HeroActions from "./HeroActions";
import GoogleRatingBadge from "@/components/reviews/GoogleRatingBadge";
import homeBg from "@/public/images/home.jpg";
import { useBusinessContext } from "@/lib/context/BusinessContext";
import { getBusinessOpenStatus, getScheduleSummary, BusinessOpenStatus } from "@/utils/businessHours";
import type { GoogleReviewsData } from "@/lib/types/BusinessSettings";

interface HeroProps {
  reviewsData?: GoogleReviewsData | null;
}

export default function Hero({ reviewsData }: Readonly<HeroProps>) {
  const { businessSettings, businessHours, isEnabled } = useBusinessContext();
  const [openStatus, setOpenStatus] = useState<BusinessOpenStatus | null>(null);

  const reviewsConfig = businessSettings?.google_reviews;
  const isReviewsFlag = isEnabled ? isEnabled("google_reviews") : false;
  const showHeroBadge =
    isReviewsFlag &&
    reviewsConfig?.enabled !== false &&
    reviewsConfig?.show_in_hero !== false &&
    Boolean(reviewsData);

  useEffect(() => {
    const checkStatus = () => {
      setOpenStatus(getBusinessOpenStatus(businessHours));
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30_000);
    return () => clearInterval(interval);
  }, [businessHours]);

  const scheduleSummary = getScheduleSummary(businessHours);
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

      {/* Dynamic business status indicator & schedule */}
      {openStatus && (
        <div className="absolute top-5 sm:top-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5 w-full max-w-lg px-4 pointer-events-none">
          <div
            className={`px-3 py-1 rounded-full backdrop-blur-md flex items-center gap-1.5 transition-all duration-300 border ${
              openStatus.isOpen
                ? "border-[var(--accent)]/30 bg-slate-950/70 shadow-sm shadow-[var(--accent)]/15"
                : "border-slate-800/80 bg-slate-950/80 shadow-sm"
            }`}
          >
            {openStatus.isOpen ? (
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--accent)]" />
              </span>
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500/80" />
            )}

            <span
              className={`text-[10px] font-bold tracking-[0.2em] uppercase ${
                openStatus.isOpen ? "text-[var(--accent)]" : "text-slate-400"
              }`}
            >
              {openStatus.isOpen ? "Abierto Ahora" : "Cerrado"}
            </span>
          </div>

          {scheduleSummary && (
            <div className="flex items-center justify-center gap-1.5 text-[11px] sm:text-xs text-slate-300/85 font-medium tracking-wide drop-shadow-sm">
              <Clock className="w-3.5 h-3.5 text-[var(--accent)] flex-shrink-0" />
              <span>{scheduleSummary}</span>
            </div>
          )}
        </div>
      )}

      <div className="relative z-10 space-y-6 px-6 max-w-2xl py-12 pt-20 sm:pt-24">
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-none">
            {firstPart}{firstPart ? " " : ""}
            <span className="bg-gradient-to-r from-[var(--accent)] via-[#fcebb6] to-[var(--accent)] bg-clip-text text-transparent">
              {lastWord}
            </span>
          </h1>
          <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent mx-auto my-3" />
          <p className="text-base sm:text-lg text-slate-300 font-medium tracking-wide max-w-md mx-auto leading-relaxed">
            {businessSettings?.slogan ?? "Corte, afeitado tradicional y estilo diseñado para el caballero moderno. Reservá tu turno de forma ágil y cómoda."}
          </p>

          {showHeroBadge && (
            <div className="pt-2">
              <GoogleRatingBadge data={reviewsData} />
            </div>
          )}
        </div>

        <HeroActions />
      </div>
    </section>
  );
}
