"use client";

import ArcaPage from "@/components/arca/ArcaPage";
import BackButton from "@/components/ui/BackButton";

export default function AdminFacturacionPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <BackButton href="/admin" label="Panel Admin" />
      <ArcaPage />
    </div>
  );
}
