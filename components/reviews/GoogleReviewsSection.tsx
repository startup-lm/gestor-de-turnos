"use client";

import React, { useState } from "react";
import { Star, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { useKeenSlider, KeenSliderInstance } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import { KeenAutoplayPlugin } from "@/utils/autoplayPlugin";
import GoogleReviewCard from "./GoogleReviewCard";
import GoogleAttribution from "./GoogleAttribution";
import type { GoogleReviewsData } from "@/lib/types/BusinessSettings";

interface Props {
  data?: GoogleReviewsData | null;
  className?: string;
  title?: string;
  subtitle?: string;
}

export default function GoogleReviewsSection({
  data,
  className = "",
  title = "Lo que dicen nuestros clientes",
  subtitle = "Opiniones de quienes ya vivieron la experiencia en nuestros servicios",
}: Readonly<Props>) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const rawRating = data?.rating;
  const rating = rawRating != null ? Number(rawRating).toFixed(1) : "5.0";
  const totalReviews = data?.total || 0;
  const writeUrl = data?.writeReviewUrl;
  const googleMapsUri = data?.googleMapsUri;

  const { reviews: reviewList = [] } = data || {};
  const visibleReviews = reviewList.filter((r) => r.visible !== false);
  const count = visibleReviews.length;

  const desktopPerView = Math.min(count, 3) || 1;
  const tabletPerView = Math.min(count, 2) || 1;
  const canSlideDesktop = count > 3;
  const canSlideTablet = count > 2;
  const canSlideMobile = count > 1;

  const autoplayPlugin = (slider: KeenSliderInstance) => KeenAutoplayPlugin(slider, 4500);

  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>(
    {
      loop: canSlideDesktop,
      mode: "snap",
      slideChanged(slider) {
        setCurrentSlide(slider.track.details.rel);
      },
      created() {
        setLoaded(true);
      },
      slides: {
        perView: 1,
        spacing: 16,
      },
      breakpoints: {
        "(min-width: 640px)": {
          slides: { perView: tabletPerView, spacing: 18 },
        },
        "(min-width: 1024px)": {
          slides: { perView: desktopPerView, spacing: 20 },
        },
      },
      renderMode: "performance",
    },
    canSlideDesktop ? [autoplayPlugin] : []
  );

  if (!data) {
    return null;
  }

  if (count === 0 && !writeUrl && !googleMapsUri) {
    return null;
  }

  return (
    <section
      id="resenas-google"
      className={`py-8 px-5 sm:px-10 bg-[#0a0f1d]/75 backdrop-blur-xl border border-slate-800/80 rounded-3xl shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-[var(--accent)]/30 ${className}`}
    >
      {/* Ambient corner glow */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-[var(--accent)]/5 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-500/5 rounded-full blur-[90px] pointer-events-none" />

      {/* Cabecera de la sección */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-800/60 relative z-10">
        <div className="text-center md:text-left space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
            {title}
          </h2>

          <p className="text-xs sm:text-sm text-slate-400 font-medium max-w-xl">
            {subtitle}
          </p>

          {/* Resumen de puntuación oficial de Google con atribución */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 pt-1">
            <span className="text-sm font-bold text-white">{rating}</span>
            <div className="flex items-center gap-0.5" aria-label={`${rating} estrellas de 5`}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
                />
              ))}
            </div>
            {totalReviews > 0 && (
              <span className="text-xs text-slate-400">
                ({totalReviews} opiniones)
              </span>
            )}
            <span className="text-slate-600 hidden sm:inline">•</span>
            <GoogleAttribution className="h-4 w-auto" />
          </div>

          <p className="text-[11px] text-slate-500 font-normal">
            Reseñas de Google, ordenadas por relevancia
          </p>
        </div>
      </div>

      {/* Contenedor Carrusel de Reseñas */}
      {count > 0 ? (
        <div className="relative overflow-visible px-2 sm:px-4">
          {/* Flecha Izquierda */}
          {canSlideMobile && (
            <button
              type="button"
              onClick={() => instanceRef.current?.prev()}
              aria-label="Anterior"
              className={`!absolute !-left-2 sm:!-left-4 !top-1/2 !-translate-y-1/2 !z-20 !w-10 !h-10 !flex !items-center !justify-center !rounded-full !bg-slate-950/90 !backdrop-blur-md !border !border-[var(--accent)]/60 !text-[var(--accent)] hover:!bg-[var(--accent)] hover:!text-slate-950 hover:!border-[var(--accent)] active:!scale-95 !transition-all !duration-300 !shadow-lg !shadow-[var(--accent)]/10 hover:!shadow-[var(--accent)]/20 cursor-pointer ${
                !canSlideDesktop ? "lg:hidden" : ""
              } ${!canSlideTablet ? "sm:hidden" : ""}`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Flecha Derecha */}
          {canSlideMobile && (
            <button
              type="button"
              onClick={() => instanceRef.current?.next()}
              aria-label="Siguiente"
              className={`!absolute !-right-2 sm:!-right-4 !top-1/2 !-translate-y-1/2 !z-20 !w-10 !h-10 !flex !items-center !justify-center !rounded-full !bg-slate-950/90 !backdrop-blur-md !border !border-[var(--accent)]/60 !text-[var(--accent)] hover:!bg-[var(--accent)] hover:!text-slate-950 hover:!border-[var(--accent)] active:!scale-95 !transition-all !duration-300 !shadow-lg !shadow-[var(--accent)]/10 hover:!shadow-[var(--accent)]/20 cursor-pointer ${
                !canSlideDesktop ? "lg:hidden" : ""
              } ${!canSlideTablet ? "sm:hidden" : ""}`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Slider */}
          <div ref={sliderRef} className="keen-slider z-10 py-1">
            {visibleReviews.map((review) => (
              <div key={review.id} className="keen-slider__slide !h-auto flex">
                <GoogleReviewCard review={review} className="w-full flex-1" />
              </div>
            ))}
          </div>

          {/* Indicadores de diapositiva (Dots) */}
          {count > 1 && loaded && instanceRef.current && (
            <div className="flex justify-center items-center gap-1.5 mt-6 relative z-10">
              {visibleReviews.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => instanceRef.current?.moveToIdx(idx)}
                  aria-label={`Ir a reseña ${idx + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    currentSlide === idx
                      ? "w-6 bg-[var(--accent)] shadow-sm shadow-[var(--accent)]/40"
                      : "w-2 bg-slate-700 hover:bg-slate-500"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-10 px-4 border border-dashed border-slate-800 rounded-2xl">
          <p className="text-sm text-slate-400">
            Aún no hay reseñas cargadas para mostrar. ¡Sé el primero en dejarnos tu opinión en Google!
          </p>
        </div>
      )}

      {/* Enlaces al pie */}
      {(googleMapsUri || writeUrl) && (
        <div className="mt-8 pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
          {googleMapsUri && (
            <a
              href={googleMapsUri}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] rounded-xl text-xs sm:text-sm font-semibold text-white bg-slate-900/80 border border-slate-700/80 hover:bg-slate-800 hover:border-slate-600 transition-all active:scale-95 shadow-sm"
            >
              <span>Ver todas en Google</span>
              <ExternalLink className="w-4 h-4 text-slate-400" />
            </a>
          )}
          {writeUrl && (
            <a
              href={writeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-[var(--accent)] hover:opacity-95 transition-all shadow-md active:scale-95 shadow-[var(--accent)]/15"
            >
              <span>Dejar una reseña</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      )}
    </section>
  );
}
