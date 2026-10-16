"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { KeenAutoplayPlugin } from "@/utils/autoplayPlugin";
import { CarouselItem, CarouselType } from "@/lib/types/Carousel";
import logo from "@/public/images/logo.png";

export default function HomeCarousel({ type, items }: Readonly<{ type: CarouselType; items: CarouselItem[]; }>) {
  const title = type === "productos" ? "Nuestros Productos 🛍️" : "Nuestros Servicios 💈";
  const href = `/${type}`;
  const linkText = `Ver todos los ${type}`;
  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>(
    {
      loop: true,
      mode: "snap",
      slides: {
        perView: 1,
        spacing: 20,
      },
      breakpoints: {
        "(min-width: 640px)": {
          slides: { perView: 2, spacing: 20 },
        },
        "(min-width: 1024px)": {
          slides: { perView: 3, spacing: 20 },
        },
      },
      renderMode: "performance",
    },
    [KeenAutoplayPlugin]
  );

  return (
    <section className="py-8 px-6 sm:px-10 bg-[#0a0f1d]/75 backdrop-blur-xl border border-slate-800/80 rounded-3xl shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-[var(--accent)]/30">
      <h2 className="text-2xl font-bold mb-6 text-center text-white tracking-wide">
        {title}
      </h2>

      <div className="relative overflow-visible px-4">
        {/* Navigation Buttons */}
        <button 
          onClick={() => instanceRef.current?.prev()} 
          className="!absolute !-left-2 sm:!-left-4 !top-1/2 !-translate-y-1/2 !z-20 !w-10 !h-10 !flex !items-center !justify-center !rounded-full !bg-slate-950/90 !backdrop-blur-md !border !border-[var(--accent)]/60 !text-[var(--accent)] hover:!bg-[var(--accent)] hover:!text-slate-950 hover:!border-[var(--accent)] active:!scale-95 !transition-all !duration-300 !shadow-lg !shadow-[var(--accent)]/10 hover:!shadow-[var(--accent)]/20 !pointer-events-auto"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div ref={sliderRef} className="keen-slider z-10">
          {items.map((item) => {
            return (
              <div 
                key={item.id} 
                className="keen-slider__slide !h-48 sm:!h-56 !rounded-2xl !bg-slate-950/40 border border-slate-800/80 overflow-hidden shadow-lg relative group transition-all duration-300 hover:border-[var(--accent)]/40 hover:-translate-y-1 hover:shadow-[var(--accent)]/10 flex flex-col justify-between"
              >
                {type === "productos" && item.image ? (
                  <div className="relative w-full h-full bg-slate-950/40 p-4 flex flex-col items-center justify-center group-hover:bg-slate-950/20 transition-colors duration-300">
                    <div className="relative w-28 h-28 mb-3 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-contain"
                        sizes="128px"
                      />
                    </div>
                    <span className="text-white font-bold text-center text-xs sm:text-sm tracking-wide line-clamp-1 group-hover:text-[var(--accent)] transition-colors duration-300">
                      {item.name}
                    </span>
                  </div>
                ) : (
                  <div className="relative w-full h-full">
                    <Image
                      src={item.image ?? logo}
                      alt={item.name}
                      fill
                      className={`object-cover rounded-lg brightness-95 group-hover:brightness-100 group-hover:scale-105 transition-all duration-500 ${!item.image ? "bg-[var(--background)]" : ""}`}
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 flex flex-col justify-end min-h-[45%]">
                      <span className="text-white font-bold text-center text-sm sm:text-base tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] group-hover:text-[var(--accent)] transition-colors duration-300">
                        {item.name}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button 
          onClick={() => instanceRef.current?.next()} 
          className="!absolute !-right-2 sm:!-right-4 !top-1/2 !-translate-y-1/2 !z-20 !w-10 !h-10 !flex !items-center !justify-center !rounded-full !bg-slate-950/90 !backdrop-blur-md !border !border-[var(--accent)]/60 !text-[var(--accent)] hover:!bg-[var(--accent)] hover:!text-slate-950 hover:!border-[var(--accent)] active:!scale-95 !transition-all !duration-300 !shadow-lg !shadow-[var(--accent)]/10 hover:!shadow-[var(--accent)]/20 !pointer-events-auto"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="text-center mt-6">
        <Link 
          href={href} 
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] uppercase tracking-wider hover:text-white transition-colors duration-200 group" 
          prefetch
        >
          {linkText}
          <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}