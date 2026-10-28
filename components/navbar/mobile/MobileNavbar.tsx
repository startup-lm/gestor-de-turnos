"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import Link from "next/link";
import LinkBarberLogo from "../LinkBarberLogo";
import { useAuth } from "@/lib/auth/AuthContext";
import MobileAuthButtons from "./MobileAuthButtons";
import MobileMenuButton from "./MobileMenuButton";
import MobileMenuHeader from "./MobileMenuHeader";
import { UserRoundCog } from "lucide-react";
import { NavPath } from "@/utils/paths";

export default function MobileNavbar({ paths }: Readonly<{ paths: NavPath[]; }>) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { role, barberId } = useAuth();
  const path = usePathname();
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Bloquear scroll de la página cuando el menú está abierto
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <nav className="relative flex justify-between w-full">
      {menuOpen ? (
        <div className="invisible">
          <MobileMenuButton onClick={() => setMenuOpen((o) => !o)} />
        </div>
      ) : (
        <MobileMenuButton onClick={() => setMenuOpen((o) => !o)} />
      )}

      <LinkBarberLogo className={menuOpen ? "invisible" : ""} onClick={closeMenu} />

      {mounted &&
        createPortal(
          <>
            {/* Backdrop que se coloca por encima de la pantalla completa */}
            {menuOpen && (
              <div
                className="fixed inset-0 !bg-black/60 !backdrop-blur-sm z-[90]"
                onClick={closeMenu}
              />
            )}

            {/* Menú que se abre de izquierda a derecha con fondo sobre toda la pantalla */}
            <div
              role="menu"
              className={`!fixed !top-0 !left-0 !h-dvh !z-[100] !w-64 !bg-slate-950/95 !backdrop-blur-2xl !border-r !border-slate-800/80 !flex !flex-col !transition-all !duration-300 !ease-in-out !shadow-2xl overflow-y-auto ${
                menuOpen ? "!left-0" : "!left-[-256px]"
              }`}
            >
              <MobileMenuHeader closeMenu={closeMenu} />

              <ul className="!flex !flex-col !items-start !p-4 !space-y-1.5 !flex-shrink-0 !w-full">
                {paths.map((p) => {
                  const Icon = p.Icon;
                  const isActive = path === p.href;
                  return (
                    <li key={p.href} className="w-full">
                      <Link
                        id={`mobile-nav-link-${p.href.replace(/\//g, "")}`}
                        href={p.href}
                        onClick={closeMenu}
                        prefetch
                        className={`!flex !items-center !w-full !text-left !px-4 !py-3 !rounded-xl !text-sm !font-medium !transition-all !duration-200 ${
                          isActive
                            ? "!bg-[var(--accent)]/10 !text-[var(--accent)] !border-l-2 !border-[var(--accent)]"
                            : "!text-slate-300 hover:!text-white hover:!bg-slate-900/40 !border-l-2 !border-transparent"
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 mr-3 !inline-block ${
                            isActive ? "!text-[var(--accent)]" : "!text-slate-400"
                          }`}
                        />
                        {p.label}
                      </Link>
                    </li>
                  );
                })}
                {role !== "guest" && (
                  <li className="w-full">
                    <Link
                      id="mobile-nav-profile"
                      href={`/barbers/${barberId}`}
                      onClick={closeMenu}
                      prefetch
                      className={`!flex !items-center !w-full !text-left !px-4 !py-3 !rounded-xl !text-sm !font-medium !transition-all !duration-200 ${
                        path === `/barbers/${barberId}`
                          ? "!bg-[var(--accent)]/10 !text-[var(--accent)] !border-l-2 !border-[var(--accent)]"
                          : "!text-slate-300 hover:!text-white hover:!bg-slate-900/40 !border-l-2 !border-transparent"
                      }`}
                    >
                      <UserRoundCog
                        className={`w-4 h-4 mr-3 !inline-block ${
                          path === `/barbers/${barberId}`
                            ? "!text-[var(--accent)]"
                            : "!text-slate-400"
                        }`}
                      />
                      Mi Perfil
                    </Link>
                  </li>
                )}
              </ul>

              <MobileAuthButtons role={role} closeMenu={closeMenu} />
            </div>
          </>,
          document.body
        )}
    </nav>
  );
}

