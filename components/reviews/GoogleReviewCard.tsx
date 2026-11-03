"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Star, Quote } from "lucide-react";
import type { GoogleReviewItem } from "@/lib/types/BusinessSettings";

interface Props {
  review: GoogleReviewItem;
  className?: string;
}

export default function GoogleReviewCard({ review, className = "" }: Readonly<Props>) {
  const [photoError, setPhotoError] = useState(false);
  const rating = Math.min(5, Math.max(1, Math.round(review.rating || 5)));
  const initials = review.author_name
    ? review.author_name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0]?.toUpperCase() || "")
        .join("")
    : "G";

  const showPhoto = Boolean(review.author_photo_url) && !photoError;

  return (
    <article
      className={`h-full flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-[#0a0f1d]/75 backdrop-blur-xl border border-slate-800/80 shadow-xl transition-all duration-300 hover:border-[var(--accent)]/40 hover:shadow-2xl hover:shadow-[var(--accent)]/5 hover:-translate-y-0.5 relative group ${className}`}
    >
      {/* Comillas sutiles de fondo decorativas */}
      <div className="absolute top-4 right-4 text-slate-800/40 pointer-events-none group-hover:text-[var(--accent)]/10 transition-colors">
        <Quote className="w-8 h-8" />
      </div>

      <div>
        {/* Cabecera: Avatar, nombre y fecha */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-slate-800 border border-slate-700/60 flex items-center justify-center">
            {showPhoto ? (
              <Image
                src={review.author_photo_url!}
                alt={review.author_name}
                fill
                unoptimized
                onError={() => setPhotoError(true)}
                className="object-cover"
                sizes="40px"
              />
            ) : (
              <span className="text-xs font-bold text-[var(--accent)]">{initials}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {review.author_url ? (
                <a
                  href={review.author_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-bold text-white truncate hover:underline hover:text-[var(--accent)] transition-colors inline-block"
                >
                  {review.author_name}
                </a>
              ) : (
                <h3 className="text-sm font-bold text-white truncate">
                  {review.author_name}
                </h3>
              )}
            </div>
            {review.relative_time && (
              <p className="text-[11px] text-slate-400 font-medium">
                {review.relative_time}
              </p>
            )}
          </div>
        </div>

        {/* Estrellas */}
        <div className="flex items-center gap-0.5 mb-3" aria-label={`${rating} estrellas de 5`}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-3.5 h-3.5 ${
                star <= rating
                  ? "fill-amber-400 text-amber-400"
                  : "fill-slate-800 text-slate-800"
              }`}
            />
          ))}
        </div>

        {/* Texto de la opinión */}
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
          &ldquo;{review.text}&rdquo;
        </p>
      </div>
    </article>
  );
}
