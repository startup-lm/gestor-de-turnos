"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PlusCircle,
  CalendarDays,
  Calendar,
  ShoppingBag,
  FileText,
  Users,
} from "lucide-react";
import BlockDateModal from "@/components/admin/BlockDateModal";
import RegisterSaleModal from "@/components/sales/RegisterSaleModal";
import { useBusinessContext } from "@/lib/context/BusinessContext";
import { useAuth } from "@/lib/auth/AuthContext";

interface OperacionCard {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  show?: boolean;
}

export default function OperacionesPage() {
  const [activeModal, setActiveModal] = useState<"sale" | "block" | null>(null);
  const router = useRouter();
  const { isEnabled } = useBusinessContext();
  const { role } = useAuth();
  const isAdmin = role === "admin";

  const dailyCards: OperacionCard[] = [
    {
      label: "Nueva Venta",
      description: "Registrar venta",
      icon: PlusCircle,
      onClick: () => setActiveModal("sale"),
    },
    {
      label: "Bloquear Horarios",
      description: "Bloquear horarios",
      icon: CalendarDays,
      onClick: () => setActiveModal("block"),
    },
    {
      label: "Ver Turnos",
      description: "Agenda completa",
      icon: Calendar,
      onClick: () => router.push("/operaciones/turnos"),
    },
    {
      label: "Ver Ventas",
      description: "Historial de productos",
      icon: ShoppingBag,
      onClick: () => router.push("/operaciones/ventas"),
    },
  ];

  const businessCards: OperacionCard[] = [
    {
      label: "Facturación",
      description: "ARCA / AFIP",
      icon: FileText,
      onClick: () => router.push("/operaciones/facturacion"),
      show: isEnabled("arca"),
    },
    {
      label: "Barberos",
      description: "Gestión de personal",
      icon: Users,
      onClick: () => router.push("/operaciones/barberos"),
    },
  ];

  const renderCard = (item: OperacionCard) => {
    return (
      <button
        key={item.label}
        onClick={item.onClick}
        className="relative flex flex-col items-center justify-center p-6 md:p-8 rounded-2xl text-center transition-all duration-300 group overflow-hidden border shadow-md hover:-translate-y-1 hover:shadow-lg w-full !bg-[var(--accent)] !text-black !border-[var(--accent)] hover:!bg-[var(--accent)]/90 cursor-pointer"
      >
        <div className="mb-4 p-4 rounded-full transition-transform duration-300 group-hover:scale-110 bg-[var(--primary)]/15">
          <item.icon className="w-8 h-8 !text-black" />
        </div>
        <h3 className="text-lg md:text-xl font-bold mb-1 !text-black">{item.label}</h3>
        <p className="text-xs md:text-sm font-medium !text-gray-800">
          {item.description}
        </p>
      </button>
    );
  };

  const visibleBusinessCards = businessCards.filter((c) => c.show !== false);

  return (
    <div className="flex flex-col items-center p-6 min-h-[calc(100vh-64px)] w-full max-w-6xl mx-auto">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-[var(--foreground)] via-[var(--foreground)] to-[var(--accent)] bg-clip-text text-transparent">
          Operaciones
        </h1>
        <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">
          Gestión de turnos, ventas y tareas del día a día
        </p>
      </header>

      <div className="w-full space-y-10">
        {/* Bloque 1: Gestión Diaria */}
        <div className="w-full">
          <h2 className="text-lg font-bold tracking-tight mb-4 text-left border-b border-gray-800 pb-2 text-[var(--foreground)]/80">
            Gestión Diaria
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full">
            {dailyCards.map(renderCard)}
          </div>
        </div>

        {/* Bloque 2: Gestión de Negocio (Solo Admin) */}
        {isAdmin && visibleBusinessCards.length > 0 && (
          <div className="w-full">
            <h2 className="text-lg font-bold tracking-tight mb-4 text-left border-b border-gray-800 pb-2 text-[var(--foreground)]/80">
              Gestión de Negocio
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full">
              {visibleBusinessCards.map(renderCard)}
            </div>
          </div>
        )}
      </div>

      {activeModal === "sale" && <RegisterSaleModal onClose={() => setActiveModal(null)} />}
      {activeModal === "block" && <BlockDateModal onClose={() => setActiveModal(null)} />}
    </div>
  );
}
