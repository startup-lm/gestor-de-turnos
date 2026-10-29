import React from "react";
import { Star } from "lucide-react";

interface Props {
  rating?: number;
  totalReviews?: number;
  className?: string;
  onClick?: () => void;
  href?: string;
}

export default function GoogleRatingBadge({
  rating = 5.0,
  totalReviews = 0,
  className = "",
  onClick,
  href,
}: Readonly<Props>) {
  const formattedRating = Number(rating).toFixed(1);

  const content = (
    <div
      className={`inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-950/75 backdrop-blur-md border border-slate-800/90 shadow-sm cursor-default select-none ${className}`}
    >
      {/* Icono oficial Google con los 4 colores SVG */}
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
          ({totalReviews}+ en Google)
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
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
