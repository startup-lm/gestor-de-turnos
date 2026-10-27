import { Suspense } from "react";
import { Metadata } from "next";
import LoginClient from "./LoginClient";
import { LoginCardSkeleton } from "@/components/loading/Skeleton";

export const metadata: Metadata = {
  title: "Iniciar sesión | Barbería",
  description: "Iniciar sesión en el sistema.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginCardSkeleton />}>
      <LoginClient />
    </Suspense>
  );
}
