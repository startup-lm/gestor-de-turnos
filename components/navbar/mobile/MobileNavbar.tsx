"use client";

import { useState } from "react";
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
  const { role, barberId } = useAuth();
  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="relative flex justify-between w-full">
      {menuOpen ? (
        <div className="fixed inset-0 !bg-black/50 z-20" onClick={closeMenu} />
      ) : (
        <MobileMenuButton onClick={() => setMenuOpen((o) => !o)} />
      )}

      <LinkBarberLogo className={menuOpen ? "invisible" : ""} onClick={closeMenu} />

      <div role="menu" className={`fixed top-0 left-0 h-full z-30 w-1/2 bg-[var(--bg-navbar)] flex flex-col transition-all duration-250 ease-out ${menuOpen ? "left-0" : "left-[-100%]"}`} >
        <MobileMenuHeader closeMenu={closeMenu} />

        <ul className="flex flex-col items-start p-4 space-y-2 flex-shrink-0">
          {paths.map((p) => {
            const Icon = p.Icon;
            return (
              <li key={p.href} className="w-full">
                <Link href={p.href} onClick={closeMenu} prefetch className="block w-full text-left p-2 rounded" >
                  <Icon className="w-4 h-4 mr-2 mb-1 inline" />
                  {p.label}
                </Link>
              </li>
            )
          })}
          {role !== "guest" && (
            <li>
              <Link href={`/barbers/${barberId}`} onClick={closeMenu} prefetch className="block w-full text-left p-2 rounded" >
                <UserRoundCog className="w-4 h-4 mr-2 mb-1 inline" />
                Mi Perfil
              </Link>
            </li>
          )}
        </ul>

        <MobileAuthButtons role={role} closeMenu={closeMenu} />
      </div>
    </nav>
  );
}
