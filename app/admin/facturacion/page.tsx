"use client";

import { notFound } from "next/navigation";
import ArcaPage from "@/components/arca/ArcaPage";
import BackButton from "@/components/ui/BackButton";
import { useBusinessContext } from "@/lib/context/BusinessContext";

export default function AdminFacturacionPage() {
  const { isEnabled } = useBusinessContext();

  if (!isEnabled("arca")) {
    notFound();
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <BackButton href="/admin" label="Panel Admin" />
      <ArcaPage />
    </div>
  );
}
