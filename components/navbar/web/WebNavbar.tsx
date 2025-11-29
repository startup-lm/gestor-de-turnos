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
        <ul className="flex space-x-6">
          {paths.map((p) => (
            <li key={p.href}>
              <Link href={p.href} prefetch className={`whitespace-nowrap px-2 py-1 hover:text-[var(--accent)] ${path === p.href ? "text-[var(--accent)] font-semibold" : "text-[var(--foreground)]"}`} >
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
