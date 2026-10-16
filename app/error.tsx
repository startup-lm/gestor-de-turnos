"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  useEffect(() => {
    console.error("Error en la app:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
        <span className="text-2xl text-red-400">⚠️</span>
      </div>
      <h1 className="text-2xl font-bold mb-2 text-[var(--foreground)]">¡Ups! Algo salió mal</h1>
      <p className="mb-6 text-sm text-[var(--foreground)]/60 max-w-md">
        {error.message || "Ocurrió un error inesperado al cargar la página."}
      </p>
      <button
        className="px-5 py-2.5 bg-[var(--accent)] text-[var(--background)] font-medium rounded-xl hover:opacity-90 transition active:scale-95 shadow-md"
        onClick={() => reset()}
      >
        Volver a intentar
      </button>
    </div>
  );
}
