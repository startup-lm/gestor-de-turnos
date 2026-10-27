"use client";

import Link from "next/link";
import NavbarLogoutButton from "../NavbarLogoutButton";
import { LogIn } from "lucide-react";

export default function MobileAuthButtons({
  role,
  closeMenu,
}: Readonly<{ role: string; closeMenu?: () => void }>) {
  return (
    <div className="mt-auto p-4 w-full flex-shrink-0 flex flex-col items-start">
      {role === "guest" ? (
        <Link
          id="btn-mobile-login"
          href="/login"
          onClick={closeMenu}
          className="btn-auth-mobile text-sm !p-2 flex items-center"
          aria-label="Iniciar sesión"
        >
          <LogIn className="w-4 h-4 mr-2 mb-0.5 inline" />
          <span>Iniciar sesión</span>
        </Link>
      ) : (
        <NavbarLogoutButton className="btn-auth-mobile text-sm" onLoggedOut={closeMenu} />
      )}
    </div>
  );
}
