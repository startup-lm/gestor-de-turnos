"use client";
import { useEffect, useState } from "react";

/** Observa un media-query de forma segura (SSR-friendly) sin APIs deprecadas */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mql = window.matchMedia(query);
    const handleMqlChange = (e: MediaQueryListEvent) => setMatches(e.matches);

    // Estado inicial
    setMatches(mql.matches);

    // Camino moderno
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", handleMqlChange);
      return () => mql.removeEventListener("change", handleMqlChange);
    }

    // Camino alternativo (onchange) — no deprecado
    if ("onchange" in mql) {
      const prev = mql.onchange;
      mql.onchange = handleMqlChange;
      return () => {
        // restaurar si no fue reemplazado en otro lado
        if (mql.onchange === handleMqlChange) mql.onchange = prev ?? null;
      };
    }

    // Último recurso: escuchar resize y re-evaluar el media query
    const onResize = () => setMatches(window.matchMedia(query).matches);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [query]);

  return matches;
}

/** Tailwind: sm = 640px ⇒ mobile es < 640px */
export function useIsMobile() {
  const matches = useMediaQuery("(max-width: 639.98px)");
  // Si aún no se evaluó (SSR/primer render), asumimos mobile para evitar saltos
  return matches ?? true;
}