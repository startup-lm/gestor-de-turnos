import React from "react";
import { Star } from "lucide-react";
import GoogleAttribution from "./GoogleAttribution";
import type { GoogleReviewsData } from "@/lib/types/BusinessSettings";

interface Props {
  data?: GoogleReviewsData | null;
  className?: string;
  onClick?: () => void;
  href?: string;
}

export default function GoogleRatingBadge({
  data,
  className = "",
  onClick,
  href,
}: Readonly<Props>) {
  if (!data) {
    return null;
  }

  const { rating: score, total: totalCount } = data;
  const totalReviews = totalCount ?? 0;
  // Sin opiniones no hay calificación real que mostrar: nunca se inventa un puntaje
  if (score == null || totalReviews === 0) {
    return null;
  }
  const formattedRating = Number(score).toFixed(1);
  const targetHref = href || data.googleMapsUri;

  const content = (
    <div
      className={`inline-flex items-center gap-2.5 px-3.5 py-1.5 min-h-[44px] rounded-full bg-slate-950/75 backdrop-blur-md border border-slate-800/90 shadow-sm cursor-default select-none ${className}`}
    >
      <GoogleAttribution className="h-3.5 w-auto flex-shrink-0" />

      {/* Puntuación numérica */}
      <span className="text-xs font-bold text-white tracking-tight">
        {formattedRating}
      </span>

      {/* Estrellas doradas */}
      <div className="flex items-center gap-0.5" aria-label={`${formattedRating} estrellas de 5`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
          />
        ))}
      </div>

      {/* Total de reseñas */}
      {totalReviews > 0 && (
        <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-300 transition-colors">
          ({totalReviews} opiniones)
        </span>
      )}
    </div>
  );

  if (targetHref) {
    return (
      <a
        href={targetHref}
        target={targetHref.startsWith("http") ? "_blank" : undefined}
        rel={targetHref.startsWith("http") ? "noopener noreferrer" : undefined}
        className="inline-block cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent)] rounded-full"
      >
        {content}
      </a>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="inline-block cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent)] rounded-full"
      >
        {content}
      </button>
    );
  }

  return content;
}
