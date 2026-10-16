"use client";

import { useEffect } from "react";
import { notFound, useRouter } from "next/navigation";
import ArcaPage from "@/components/arca/ArcaPage";
import BackButton from "@/components/ui/BackButton";
import { useBusinessContext } from "@/lib/context/BusinessContext";
import { useAuth } from "@/lib/auth/AuthContext";

export default function OperacionesFacturacionPage() {
  const { isEnabled } = useBusinessContext();
  const { role, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (role === "guest" && user) return;
    if (role && role !== "admin") {
      router.replace("/operaciones");
    }
  }, [role, user, router]);

  if (!isEnabled("arca")) {
    notFound();
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <BackButton href="/operaciones" label="Operaciones" />
      <ArcaPage />
    </div>
  );
}
