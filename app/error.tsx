"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: Readonly<{ error: Error; reset: () => void }>) {
  useEffect(() => {
    console.error("Error en la app:", error);
  }, [error]);

  return (
    <html>
      <body className="p-10 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">¡Ups! Algo salió mal.</h1>
        <p className="mb-6">{error.message}</p>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => reset()}
        >
          Volver a intentar
        </button>
      </body>
    </html>
  );
}
