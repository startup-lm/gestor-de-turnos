"use client";

import { useEffect, useRef } from "react";
import MobileNavbar from "./mobile/MobileNavbar";
import WebNavbar from "./web/WebNavbar";
import { getPaths } from "../../utils/paths";
import { useAuth } from "@/lib/auth/AuthContext";

export default function Navbar() {
  const { role } = useAuth();
  const paths = getPaths(role);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const updateNavbarHeight = () => {
      if (headerRef.current) {
        const h = Math.round(headerRef.current.getBoundingClientRect().height);
        if (h > 0) {
          document.documentElement.style.setProperty("--navbar-height", `${h}px`);
        }
      }
    };

    updateNavbarHeight();
    window.addEventListener("resize", updateNavbarHeight);
    return () => window.removeEventListener("resize", updateNavbarHeight);
  }, []);

  return (
    <header ref={headerRef} className="navbar sticky top-0 left-0 w-full z-50">
      <div className="md:hidden w-full">
        <MobileNavbar paths={paths} />
      </div>

      <div className="hidden md:block w-full max-w-[1720px] mx-auto px-2 md:px-4">
        <WebNavbar paths={paths} />
      </div>
    </header>
  );
}
