"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import Link from "next/link";

export default function HeroActions() {
  const { setRole } = useAuth();

  return (
    <div className="mt-6 flex flex-col justify-center gap-6">
      <Link href="/turnos" prefetch={true}>
        <button onClick={() => setRole("guest")} className="btn-home-primary px-6 py-3 text-2xl sm:text-3xl !shadow-lg !shadow-[var(--accent)]/30" >
          Reservar turno ✂️
        </button>
      </Link>
      <Link href="/turnos/cancelar" prefetch={true}>
        <button onClick={() => setRole("guest")} className="btn-home-secondary px-6 py-3 text-base sm:text-md" >
          Cancelar turno 🚫
        </button>
      </Link>
    </div>
  );
}
