"use client";

import LinkBarberLogo from "../LinkBarberLogo";
import UserMenu from "./UserMenu";
import { usePathname } from "next/navigation";
import Link from "next/link";

type NavPath = { href: string; label: string };

export default function WebNavbar({ paths }: Readonly<{ paths: NavPath[]; }>) {
  const path = usePathname();

  return (
    <nav className="grid grid-cols-3 items-center">
      <div className="justify-self-start">
        <LinkBarberLogo />
      </div>

      <div className="justify-self-center">
        <ul className="flex space-x-1 lg:space-x-3">
          {paths.map((p) => (
            <li key={p.href}>
              <Link 
                id={`nav-link-${p.href.replace(/\//g, "")}`} 
                href={p.href} 
                prefetch 
                className={`!inline-flex !items-center !justify-center !px-4 !py-2 !rounded-xl !text-sm !font-medium !transition-all !duration-300 !whitespace-nowrap ${
                  path === p.href 
                    ? "!text-[var(--accent)] !bg-slate-900/60 !border !border-[var(--accent)]/30 !shadow-lg !shadow-[var(--accent)]/5" 
                    : "!text-slate-300 hover:!text-white hover:!bg-slate-950/40 hover:!border-slate-800/60 !border !border-transparent"
                }`}
              >
                {p.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="justify-self-end">
        <UserMenu />
      </div>
    </nav>
  );
}
