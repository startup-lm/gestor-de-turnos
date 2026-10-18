import { Suspense } from "react";
import { Metadata } from "next";
import LoginClient from "./LoginClient";
import Spinner from "@/components/loading/Spinner";

export const metadata: Metadata = {
  title: "Iniciar sesión | Barbería",
  description: "Iniciar sesión en el sistema.",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-120px)] flex justify-center items-center">
          <Spinner />
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
