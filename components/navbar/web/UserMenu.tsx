"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { CircleUser } from "lucide-react";
import NavbarLogoutButton from "@/components/navbar/NavbarLogoutButton";

/** Acceso de la derecha del navbar: el invitado ve "Ingresar" (CircleUser → /login) y el usuario con sesión, el botón de cerrar sesión (solo icono). */
export default function UserMenu() {
  const { role, isLoadingAuth } = useAuth();

  if (isLoadingAuth) return null;

  if (role !== "guest") {
    return (
      <NavbarLogoutButton
        iconOnly
        iconClassName="w-7 h-7 !text-[var(--accent)]"
        className="!inline-flex !items-center !justify-center !p-1 !bg-transparent hover:!bg-slate-900/60 !border !border-[var(--accent)]/30 hover:!border-[var(--accent)]/80 !rounded-full cursor-pointer !transition-all !duration-300 !outline-none !min-w-[44px] !min-h-[44px]"
      />
    );
  }

  return (
    <Link
      href="/login"
      data-testid="user-menu-btn"
      aria-label="Ingresar"
      className="!inline-flex !items-center !justify-center !p-1 !bg-transparent hover:!bg-slate-900/60 !border !border-[var(--accent)]/30 hover:!border-[var(--accent)]/80 !rounded-full cursor-pointer !transition-all !duration-300 !outline-none !min-w-[44px] !min-h-[44px]"
    >
      <CircleUser className="w-7 h-7 !text-[var(--accent)]" />
    </Link>
  );
}
