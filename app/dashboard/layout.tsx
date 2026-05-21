"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import Spinner from "@/components/loading/Spinner";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { role, user } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Si tenemos un usuario autenticado pero el rol aún figura como "guest",
    // significa que AuthContext está recuperando el rol de la base de datos de forma asíncrona.
    // Esperamos a que termine antes de decidir si redirigir.
    if (role === "guest" && user) {
      return;
    }

    if (role !== "admin" && role !== "barber") {
      router.replace("/");
    } else {
      setChecking(false);
    }
  }, [role, user, router]);

  if (checking) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-[var(--background)]">
        <Spinner />
        <p className="text-sm font-medium text-slate-400 mt-4 animate-pulse">
          Cargando panel de control...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
