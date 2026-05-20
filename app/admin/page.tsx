"use client";


import { useState } from "react";
import { useRouter } from "next/navigation";
import BlockDateModal from "@/components/admin/BlockDateModal";
import BusinessHoursModal from "@/components/admin/BusinessHoursModal";
import {
  ShoppingBag,
  Calendar,
  Users,
  Clock,
  MessageCircle,
  CreditCard,
  FileText,
  CalendarDays,
  Share2,
  BookOpen,
  PlusCircle
} from "lucide-react";
import WhatsAppSettingsModal from "@/components/admin/WhatsAppSettingsModal";
import PaymentSettingsModal from "@/components/admin/PaymentSettingsModal";
import SocialMediaSettingsModal from "@/components/admin/SocialMediaSettingsModal";
import OurStorySettingsModal from "@/components/admin/OurStorySettingsModal";
import RegisterSaleModal from "@/components/sales/RegisterSaleModal";

export default function AdminPage() {
  const [activeModal, setActiveModal] = useState<"whatsapp" | "payments" | "hours" | "block" | "social" | "story" | "sale" | null>(null);
  const router = useRouter();

  const adminCards = [
    { label: "Ventas", description: "Historial de productos", icon: ShoppingBag, onClick: () => router.push("/admin/ventas") },
    { label: "Nueva Venta", description: "Registrar venta", icon: PlusCircle, onClick: () => setActiveModal("sale") },
    { label: "Ver Turnos", description: "Agenda completa", icon: Calendar, onClick: () => router.push("/admin/turnos") },
    { label: "Facturación", description: "ARCA / AFIP", icon: FileText, onClick: () => router.push("/admin/facturacion"), show: process.env.NEXT_PUBLIC_ENABLE_ARCA === "true" },
    { label: "Barberos", description: "Gestión de personal", icon: Users, onClick: () => router.push("/admin/barberos") },
    { label: "Bloqueos", description: "Bloquear horarios", icon: CalendarDays, onClick: () => setActiveModal("block") },
    { label: "Horarios", description: "Días de atención", icon: Clock, onClick: () => setActiveModal("hours") },
    { label: "WhatsApp", description: "Teléfono del local", icon: MessageCircle, onClick: () => setActiveModal("whatsapp") },
    { label: "Pagos", description: "Métodos aceptados", icon: CreditCard, onClick: () => setActiveModal("payments") },
    { label: "Redes", description: "Links de RRSS", icon: Share2, onClick: () => setActiveModal("social") },
    { label: "Historia", description: "Texto Nosotros", icon: BookOpen, onClick: () => setActiveModal("story") },
  ];

  return (
    <div className="flex flex-col items-center p-6 min-h-[calc(100vh-64px)] w-full max-w-6xl mx-auto">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">Panel de Administración</h1>
        <p className="text-gray-500 dark:text-gray-400">Gestioná todos los aspectos de tu negocio</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 w-full">
        {adminCards.filter(item => item.show !== false).map((item) => (
          <button
            key={item.label}
            onClick={item.onClick}
            className={`
              relative flex flex-col items-center justify-center p-6 md:p-8 rounded-2xl text-center transition-all duration-300 group overflow-hidden border
              !bg-[var(--accent)] text-black border-[var(--primary)] shadow-md hover:-translate-y-1 hover:shadow-lg
            `}
          >
            <div className={`mb-4 p-4 rounded-full transition-transform duration-300 group-hover:scale-110 bg-[var(--primary)]/10`}>
              <item.icon className={`w-8 h-8 text-black`} />
            </div>
            <h3 className={`text-lg md:text-xl font-bold mb-1 !text-black`}>{item.label}</h3>
            <p className={`text-xs md:text-sm font-medium text-gray-800`}>
              {item.description}
            </p>
          </button>
        ))}
      </div>

      {activeModal === "whatsapp" && <WhatsAppSettingsModal onClose={() => setActiveModal(null)} />}
      {activeModal === "payments" && <PaymentSettingsModal onClose={() => setActiveModal(null)} />}
      {activeModal === "block" && (<BlockDateModal onClose={() => setActiveModal(null)} />)}
      {activeModal === "hours" && <BusinessHoursModal onClose={() => setActiveModal(null)} />}
      {activeModal === "social" && <SocialMediaSettingsModal onClose={() => setActiveModal(null)} />}
      {activeModal === "story" && <OurStorySettingsModal onClose={() => setActiveModal(null)} />}
      {activeModal === "sale" && <RegisterSaleModal onClose={() => setActiveModal(null)} />}
    </div>
  );
}
