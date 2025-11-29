"use client";

import BlockDateModal from "@/components/admin/BlockDateModal";
import EditBarberModal from "@/components/auth/EditBarberModal";
import SignupModal from "@/components/auth/SignupModal";
import CreateCardModal from "@/components/card/CreateCardModal";
import RegisterSaleModal from "@/components/sales/RegisterSaleModal";
import { useState } from "react";
import { useRouter } from "next/navigation";
import BusinessHoursModal from "@/components/admin/BusinessHoursModal";

type CreateType = "Producto" | "Servicio";

export default function AdminPage() {
  const [activeModal, setActiveModal] = useState<"block" | "signup" | "edit" | "create" | "sale" | "hours" | null>(null);
  const [createType, setCreateType] = useState<CreateType>("Producto");
  const router = useRouter();

  return (
    <div className="flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mb-15">Panel de Administración</h1>

      <div className="space-y-10 w-96 mt-4">
        <button className="w-full px-4 py-2 rounded text-2xl whitespace-nowrap" onClick={() => { setActiveModal("sale"); }} >
          Venta de Producto
        </button>

        <button className="w-full px-4 py-2 rounded text-2xl whitespace-nowrap" onClick={() => router.push("/admin/ventas")} >
          Ver Ventas
        </button>

        <button className="w-full px-4 py-2 rounded text-2xl whitespace-nowrap" onClick={() => { setCreateType("Producto"); setActiveModal("create"); }} >
          Agregar Producto
        </button>

        <button className="w-full px-4 py-2 rounded text-2xl whitespace-nowrap" onClick={() => { setCreateType("Servicio"); setActiveModal("create"); }} >
          Agregar Servicio
        </button>

        <button className="w-full px-4 py-2 rounded text-2xl whitespace-nowrap" onClick={() => setActiveModal("block")} >
          Bloquear Horarios
        </button>

        <button className="w-full px-4 py-2 rounded text-2xl whitespace-nowrap" onClick={() => setActiveModal("signup")} >
          Agregar Barbero
        </button>

        <button className="w-full px-4 py-2 rounded text-2xl whitespace-nowrap" onClick={() => setActiveModal("edit")} >
          Editar Barbero
        </button>

        <button className="w-full px-4 py-2 rounded text-2xl whitespace-nowrap" onClick={() => setActiveModal("hours")}>
          Días y horarios de atención
        </button>
      </div>

      {activeModal === "sale" && (<RegisterSaleModal onClose={() => setActiveModal(null)} />)}
      {activeModal === "create" && (<CreateCardModal type={createType} onClose={() => setActiveModal(null)} />)}
      {activeModal === "block" && (<BlockDateModal onClose={() => setActiveModal(null)} />)}
      {activeModal === "signup" && (<SignupModal onClose={() => setActiveModal(null)} />)}
      {activeModal === "edit" && (<EditBarberModal onClose={() => setActiveModal(null)} />)}
      {activeModal === "hours" && <BusinessHoursModal onClose={() => setActiveModal(null)} />}
    </div>
  );
}
