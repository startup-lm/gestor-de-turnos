"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { SectionSkeleton } from "@/components/loading/Skeleton";

export default function OperacionesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { role, user } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
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
      <div className="w-full max-w-[1720px] mx-auto p-4 md:p-8">
        <SectionSkeleton />
      </div>
    );
  }

  return <>{children}</>;
}
