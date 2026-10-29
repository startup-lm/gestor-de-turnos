"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Star, Quote } from "lucide-react";
import { GoogleReviewItem } from "@/lib/types/BusinessSettings";

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
              <h3 className="text-sm font-bold text-white truncate">
                {review.author_name}
              </h3>
              {/* Badge verificado de Google */}
              <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" aria-label="Reseña verificada de Google">
                <title>Reseña verificada de Google</title>
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
            </div>
            {review.relative_time && (
              <p className="text-[11px] text-slate-400 font-medium">
                {review.relative_time}
              </p>
            )}
          </div>
        </div>

        {/* Estrellas */}
        <div className="flex items-center gap-0.5 mb-3">
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
