"use client";

import MobileNavbar from "./mobile/MobileNavbar";
import WebNavbar from "./web/WebNavbar";
import { getPaths } from "../../utils/paths";
import { useAuth } from "@/lib/auth/AuthContext";

export default function Navbar() {
  const { role } = useAuth();
  const paths = getPaths(role);

  return (
    <header className="navbar sticky top-0 left-0 w-full z-50">
      <div className="md:hidden">
        <MobileNavbar paths={paths} />
      </div>

      <div className="hidden md:block">
        <WebNavbar paths={paths} />
      </div>
    </header>
  );
}
