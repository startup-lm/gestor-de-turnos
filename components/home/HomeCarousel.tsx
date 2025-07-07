"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import { ArrowBigLeft, ArrowBigRight } from "lucide-react";
import { KeenAutoplayPlugin } from "@/utils/autoplayPlugin";
import { CarouselItem, CarouselType } from "@/lib/types/Carousel";

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
        spacing: 15,
      },
      breakpoints: {
        "(min-width: 1024px)": {
          slides: { perView: 3, spacing: 15 },
        },
      },
      renderMode: "performance",
    },
    [KeenAutoplayPlugin]
  );

  return (
    <section className="py-4 grey-container">
      <h2 className="text-2xl font-semibold mb-4 text-center">
        {title}
      </h2>

      <div className="relative overflow-visible px-8">
        <button onClick={() => instanceRef.current?.prev()} className="img-slider-btn left" >
          <ArrowBigLeft />
        </button>

        <div ref={sliderRef} className="keen-slider z-10">
          {items.map((item) => {
            return (
              <div key={item.id} className="keen-slider__slide img-slider-card" >
                {type === "productos" && item.image ? (
                  <Image src={item.image} alt={item.name} width={128} height={128} className="w-full h-full object-contain" />
                ) : (
                  <div className="relative w-full h-full">
                    <Image src={item.image ?? "/images/logo_hooligans.png"} alt={item.name} fill className={`object-cover rounded-lg brightness-50 ${!item.image ? "bg-[var(--background)]" : ""}`} sizes="(max-width: 768px) 100vw, 33vw" priority
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-white font-semibold text-center px-2 text-sm sm:text-base md:text-md">
                      <span className="text-[var(--foreground)] font-semibold text-center">{item.name}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button onClick={() => instanceRef.current?.next()} className="img-slider-btn right" >
          <ArrowBigRight />
        </button>
      </div>


      <div className="text-center mt-4">
        <Link href={href} className="underline" prefetch>
          {linkText}
        </Link>
      </div>
    </section>
  );
}