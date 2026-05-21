"use client";

import LinkBarberLogo from "../LinkBarberLogo";
import { useBusinessContext } from "@/lib/context/BusinessContext";

export default function MobileMenuHeader({ closeMenu }: Readonly<{ closeMenu: () => void; }>) {
  const { businessSettings } = useBusinessContext();
  
  return (
    <div className="flex flex-col items-center p-6">
      <LinkBarberLogo onClick={closeMenu} />
      <h1 className="text-4xl sm:text-5xl font-bold text-center">
        {businessSettings?.business_name || "Barbería"}<br />
      </h1>
    </div>
  );
}