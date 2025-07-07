"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { CircleUser, User } from "lucide-react";
import NavbarLogoutButton from "../NavbarLogoutButton";
import LoginModal from "@/components/auth/LoginModal";

export default function UserMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { role, barberId } = useAuth();

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleUserClick = () => {
    if (role === "guest") {
      setLoginOpen(true);
    } else {
      setMenuOpen(o => !o);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleUserClick}
        aria-label="Menú de usuario"
        className="inline-flex items-center justify-center p-0 !bg-[var(--bg-navbar)] cursor-pointer transition"
      >
        <span className="inline-flex items-center justify-center !bg-[var(--bg-navbar)] rounded-full p-0">
          <CircleUser className="w-8 h-8 !text-[var(--secondary)]" />
        </span>
      </button>

      {loginOpen && (
        <LoginModal onClose={() => setLoginOpen(false)} />
      )}

      {menuOpen && role !== "guest" && (
        <div className="absolute right-0 w-44 bg-[var(--secondary)] border border-[var(--secondary)] rounded-lg shadow-md z-50 overflow-hidden">
          <ul className="text-sm divide-y divide-[var(--primary)]/50">
            <li>
              <Link
                href={`/barbers/${barberId}`}
                onClick={() => setMenuOpen(false)}
                className="user-menu-options"
              >
                <User className="w-4 h-4 mr-2" />
                Mi Perfil
              </Link>
            </li>
            <li>
              <NavbarLogoutButton
                className="user-menu-options"
                onLoggedOut={() => setMenuOpen(false)}
                onCanceled={() => setMenuOpen(false)}
              />
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
