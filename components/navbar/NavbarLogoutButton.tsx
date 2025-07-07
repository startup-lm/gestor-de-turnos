"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { LogOut } from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function NavbarLogoutButton({ className = "", onLoggedOut, onCanceled,}: Readonly< { className?: string; onLoggedOut?: () => void; onCanceled?: () => void; } >) {
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
      <button onClick={() => setConfirmOpen(true)} className={className} aria-label="Cerrar sesión" >
        <LogOut className="w-4 h-4 mr-2 inline" />
        Cerrar sesión
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
