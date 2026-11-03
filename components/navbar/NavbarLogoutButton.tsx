"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { LogOut } from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function NavbarLogoutButton({
  className = "",
  iconClassName = "w-4 h-4",
  iconOnly = false,
  onLoggedOut,
  onCanceled,
}: Readonly<{
  className?: string;
  iconClassName?: string;
  iconOnly?: boolean;
  onLoggedOut?: () => void;
  onCanceled?: () => void;
}>) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signOut, setRole } = useAuth();

  const handleConfirm = async () => {
    setLoading(true);
    await signOut();
    setRole?.("guest");
    router.push("/");
    setLoading(false);
    setConfirmOpen(false);
    onLoggedOut?.();
  };

  return (
    <>
      <button
        id="btn-navbar-logout"
        onClick={() => setConfirmOpen(true)}
        className={className}
        aria-label="Cerrar sesión"
        title={iconOnly ? "Cerrar sesión" : undefined}
      >
        <LogOut className={`${iconClassName} inline ${iconOnly ? "" : "mr-2"}`} />
        {!iconOnly && "Cerrar sesión"}
      </button>

      {confirmOpen && (
        <ConfirmModal title="¿Estás seguro que querés cerrar sesión?" onConfirm={handleConfirm} loading={loading} button="logout"
          onCancel={() => {
            setConfirmOpen(false);
            onCanceled?.();
          }}
        />
      )}
    </>
  );
}
