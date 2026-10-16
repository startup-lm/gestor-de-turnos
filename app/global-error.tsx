"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  useEffect(() => {
    console.error("Global Error en la app:", error);
  }, [error]);

  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">¡Ups! Algo salió mal.</h1>
        <p className="mb-6 text-slate-400 max-w-md">{error.message || "Error crítico del sistema."}</p>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          onClick={() => reset()}
        >
          Volver a intentar
        </button>
      </body>
    </html>
  );
}
