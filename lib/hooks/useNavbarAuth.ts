"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";

export function useNavbarAuth(closeMenu?: () => void) {
  const router = useRouter();
  const { barberId, role, setRole, signOut } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await signOut();
    setRole?.("guest");
    router.push("/");
    setLoading(false);
    setConfirm(false);
    closeMenu?.();
  };

  return { role, barberId, isLoginOpen, setIsLoginOpen, confirm, setConfirm, loading, handleConfirm, };
}