"use client";

import ArcaPage from "@/components/arca/ArcaPage";
import BackButton from "@/components/ui/BackButton";
import { useBusinessContext } from "@/lib/context/BusinessContext";
import Link from "next/link";

export default function AdminFacturacionPage() {
  const { isEnabled } = useBusinessContext();

  if (!isEnabled("arca")) {
    return (
      <div className="p-6 max-w-xl mx-auto text-center space-y-4">
        <BackButton href="/admin" label="Panel Admin" />
        <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4 mt-6">
          <h2 className="text-xl font-bold text-white">Módulo No Disponible</h2>
          <p className="text-sm text-slate-400">
            La facturación electrónica ARCA no está habilitada para este local.
          </p>
          <Link
            href="/admin"
            className="inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition"
          >
            Volver al Panel
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <BackButton href="/admin" label="Panel Admin" />
      <ArcaPage />
    </div>
  );
}
