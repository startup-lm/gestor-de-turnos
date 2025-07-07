"use client";

import { useState } from "react";
import NavbarLogoutButton from "../NavbarLogoutButton";
import { LogIn } from "lucide-react";
import LoginModal from "@/components/auth/LoginModal";

export default function MobileAuthButtons({ role, closeMenu }: Readonly<{ role: string; closeMenu?: () => void; }>) {
  const [openLoginModal, setOpenLoginModal] = useState(false);

  const handleOpen = () => {
    setOpenLoginModal(true);
    closeMenu?.();
  };

  return (
    <div className="mt-auto p-4 w-full flex-shrink-0 flex flex-col items-start">
      {role === "guest" ? (
        <button onClick={handleOpen} className="btn-auth-mobile text-sm !p-2" aria-label="Iniciar sesión" >
          <LogIn className="w-4 h-4 mr-2 mb-1 inline" />
          Iniciar sesión
        </button>
      ) : (
        <NavbarLogoutButton className="btn-auth-mobile text-sm" onLoggedOut={closeMenu} />
      )}

      {openLoginModal && <LoginModal onClose={() => setOpenLoginModal(false)} />}
    </div>
  );
}
