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
        data-testid="user-menu-btn"
        onClick={handleUserClick}
        aria-label="Menú de usuario"
        className="!inline-flex !items-center !justify-center !p-1 !bg-transparent hover:!bg-slate-900/60 !border !border-[var(--accent)]/30 hover:!border-[var(--accent)]/80 !rounded-full cursor-pointer !transition-all !duration-300 !outline-none"
      >
        <span className="!inline-flex !items-center !justify-center !rounded-full !p-0">
          <CircleUser className="w-7 h-7 !text-[var(--accent)]" />
        </span>
      </button>

      {loginOpen && (
        <LoginModal onClose={() => setLoginOpen(false)} />
      )}

      {menuOpen && role !== "guest" && (
        <div className="!absolute !right-0 !w-48 !bg-slate-950/90 !backdrop-blur-xl !border !border-slate-800/80 !rounded-2xl !shadow-[0_10px_40px_rgba(0,0,0,0.6)] !z-50 !overflow-hidden !mt-3 !py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
          <ul className="!text-sm !divide-y !divide-slate-800/60">
            <li>
              <Link
                id="web-nav-profile"
                href={`/barbers/${barberId}`}
                onClick={() => setMenuOpen(false)}
                className="!flex !items-center !w-full !px-4 !py-2.5 !text-slate-300 hover:!text-[var(--accent)] hover:!bg-slate-900/60 !transition-all !duration-200"
              >
                <User className="w-4 h-4 mr-2.5 !text-[var(--accent)]" />
                Mi Perfil
              </Link>
            </li>
            <li>
              <div data-testid="logout-btn-wrapper" className="w-full">
                <NavbarLogoutButton
                  className="!flex !items-center !w-full !px-4 !py-2.5 !text-slate-300 hover:!text-red-400 hover:!bg-red-500/5 !transition-all !duration-200 cursor-pointer !bg-transparent !outline-none"
                  onLoggedOut={() => setMenuOpen(false)}
                  onCanceled={() => setMenuOpen(false)}
                />
              </div>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
