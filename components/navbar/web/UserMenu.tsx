"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { CircleUser } from "lucide-react";

/**
 * Acceso a "Ingresar" para invitados. Con sesión iniciada no se muestra:
 * el personal entra por "Administración" y cierra sesión desde el pie del sidebar de /admin.
 */
export default function UserMenu() {
  const { role, isLoadingAuth } = useAuth();

  if (isLoadingAuth || role !== "guest") return null;

  return (
    <Link
      href="/login"
      data-testid="user-menu-btn"
      aria-label="Ingresar"
      className="!inline-flex !items-center !justify-center !p-1 !bg-transparent hover:!bg-slate-900/60 !border !border-[var(--accent)]/30 hover:!border-[var(--accent)]/80 !rounded-full cursor-pointer !transition-all !duration-300 !outline-none"
    >
      <CircleUser className="w-7 h-7 !text-[var(--accent)]" />
    </Link>
  );
}
