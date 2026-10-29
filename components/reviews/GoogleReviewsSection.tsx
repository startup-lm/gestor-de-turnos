"use client";

import React, { useState } from "react";
import { Star, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { useKeenSlider, KeenSliderInstance } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import { KeenAutoplayPlugin } from "@/utils/autoplayPlugin";
import GoogleReviewCard from "./GoogleReviewCard";
import { GoogleReviewsConfig } from "@/lib/types/BusinessSettings";

interface Props {
  config?: GoogleReviewsConfig;
  className?: string;
  title?: string;
  subtitle?: string;
}

export default function GoogleReviewsSection({
  config,
  className = "",
  title = "Lo que dicen nuestros clientes",
  subtitle = "Opiniones de quienes ya vivieron la experiencia en nuestros servicios",
}: Readonly<Props>) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const rating = Number(config?.rating || 5.0).toFixed(1);
  const totalReviews = config?.user_ratings_total || 0;
  const writeUrl =
    config?.write_review_url ||
    (config?.place_id
      ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(config.place_id)}`
      : undefined);

  const visibleReviews = (config?.reviews || []).filter((r) => r.visible !== false);
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

  if (!config || config.enabled === false) {
    return null;
  }

  if (count === 0 && !writeUrl) {
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

          {/* Resumen de puntuación oficial de Google */}
          <div className="flex items-center justify-center md:justify-start gap-2 pt-1">
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="text-sm font-bold text-white">{rating}</span>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
                />
              ))}
            </div>
            {totalReviews > 0 && (
              <span className="text-xs text-slate-400">
                ({totalReviews} opiniones en Google)
              </span>
            )}
          </div>
        </div>

        {/* Botón directo a Google Maps para escribir reseña */}
        {writeUrl && (
          <a
            href={writeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold text-[var(--accent)] bg-[var(--accent)]/10 border border-[var(--accent)]/30 hover:bg-[var(--accent)] hover:text-slate-950 transition-all duration-300 shadow-sm hover:shadow-[var(--accent)]/20 active:scale-95 group flex-shrink-0"
          >
            <span>Dejanos tu opinión en Google</span>
            <ExternalLink className="w-4 h-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        )}
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
    </section>
  );
}
