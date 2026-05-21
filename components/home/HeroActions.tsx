"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import Link from "next/link";
import { Scissors, CalendarX } from "lucide-react";

export default function HeroActions() {
  const { setRole } = useAuth();

  return (
    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 w-full max-w-md mx-auto relative z-20">
      <Link href="/turnos" prefetch={true} className="w-full sm:w-auto flex-grow">
        <button
          id="btn-hero-reserve"
          onClick={() => setRole("guest")}
          className="!inline-flex !items-center !justify-center !gap-3 !py-4 !px-8 !rounded-xl !font-bold !text-slate-950 !bg-gradient-to-r !from-[var(--accent)] !to-[#fcebb6] hover:!opacity-95 active:scale-[0.98] !transition-all !duration-300 !shadow-lg !shadow-[var(--accent)]/20 !text-lg !w-full hover:!shadow-[var(--accent)]/40 hover:-translate-y-0.5"
        >
          <Scissors className="w-5 h-5" />
          Reservar Turno
        </button>
      </Link>
      <Link href="/turnos/cancelar" prefetch={true} className="w-full sm:w-auto">
        <button
          id="btn-hero-cancel"
          onClick={() => setRole("guest")}
          className="!inline-flex !items-center !justify-center !gap-2 !py-4 !px-6 !rounded-xl !font-semibold !text-slate-400 hover:!text-red-400 !bg-slate-950/40 !backdrop-blur-md !border !border-slate-800/80 hover:!border-red-500/40 hover:!bg-red-500/5 active:scale-[0.98] !transition-all !duration-300 !text-sm !w-full hover:-translate-y-0.5"
        >
          <CalendarX className="w-4 h-4" />
          Cancelar Turno
        </button>
      </Link>
    </div>
  );
}
