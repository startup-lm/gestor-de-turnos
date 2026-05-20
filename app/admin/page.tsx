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
    { label: "Nueva Venta", description: "Registrar venta", icon: PlusCircle, category: "rapidas", onClick: () => setActiveModal("sale") },
    { label: "Bloquear Horarios", description: "Bloquear horarios", icon: CalendarDays, category: "rapidas", onClick: () => setActiveModal("block") },

    { label: "Ver Turnos", description: "Agenda completa", icon: Calendar, category: "agenda_ventas", onClick: () => router.push("/admin/turnos") },
    { label: "Ver Ventas", description: "Historial de productos", icon: ShoppingBag, category: "agenda_ventas", onClick: () => router.push("/admin/ventas") },

    { label: "Barberos", description: "Gestión de personal", icon: Users, category: "administracion_local", onClick: () => router.push("/admin/barberos") },
    { label: "Facturación", description: "ARCA / AFIP", icon: FileText, category: "administracion_local", onClick: () => router.push("/admin/facturacion"), show: process.env.NEXT_PUBLIC_ENABLE_ARCA === "true" },
    { label: "Horarios", description: "Días de atención", icon: Clock, category: "administracion_local", onClick: () => setActiveModal("hours") },
    { label: "WhatsApp", description: "Teléfono del local", icon: MessageCircle, category: "administracion_local", onClick: () => setActiveModal("whatsapp") },
    { label: "Medios de Pago", description: "Métodos aceptados", icon: CreditCard, category: "administracion_local", onClick: () => setActiveModal("payments") },
    { label: "Redes", description: "Links de RRSS", icon: Share2, category: "administracion_local", onClick: () => setActiveModal("social") },
    { label: "Historia", description: "Texto Nosotros", icon: BookOpen, category: "administracion_local", onClick: () => setActiveModal("story") },
  ];

  const renderCard = (item: any) => {
    let cardStyle = "";
    let iconContainerStyle = "";
    let iconStyle = "";
    let titleStyle = "";
    let descStyle = "";

    if (item.category === "rapidas" || item.category === "agenda_ventas") {
      cardStyle = "!bg-[var(--accent)] !text-black !border-[var(--accent)] hover:!bg-[var(--accent)]/90";
      iconContainerStyle = "bg-[var(--primary)]/15";
      iconStyle = "!text-black";
      titleStyle = "!text-black";
      descStyle = "!text-gray-800";
    } else { // administracion_local
      cardStyle = "!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 hover:!bg-[var(--foreground)]/10 hover:!border-[var(--accent)]/40";
      iconContainerStyle = "bg-[var(--foreground)]/5";
      iconStyle = "!text-[var(--foreground)]/70 group-hover:!text-[var(--accent)]";
      titleStyle = "!text-[var(--foreground)]";
      descStyle = "!text-gray-500 dark:!text-gray-400";
    }

    return (
      <button
        key={item.label}
        onClick={item.onClick}
        className={`
          relative flex flex-col items-center justify-center p-6 md:p-8 rounded-2xl text-center transition-all duration-300 group overflow-hidden border shadow-md hover:-translate-y-1 hover:shadow-lg w-full
          ${cardStyle}
        `}
      >
        <div className={`mb-4 p-4 rounded-full transition-transform duration-300 group-hover:scale-110 ${iconContainerStyle}`}>
          <item.icon className={`w-8 h-8 ${iconStyle}`} />
        </div>
        <h3 className={`text-lg md:text-xl font-bold mb-1 ${titleStyle}`}>{item.label}</h3>
        <p className={`text-xs md:text-sm font-medium ${descStyle}`}>
          {item.description}
        </p>
      </button>
    );
  };

  const rapidasCards = adminCards.filter(c => c.category === "rapidas" && c.show !== false);
  const agendaVentasCards = adminCards.filter(c => c.category === "agenda_ventas" && c.show !== false);
  const adminLocalCards = adminCards.filter(c => c.category === "administracion_local" && c.show !== false);

  return (
    <div className="flex flex-col items-center p-6 min-h-[calc(100vh-64px)] w-full max-w-6xl mx-auto">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">Panel de Administración</h1>
        <p className="text-gray-500 dark:text-gray-400">Gestioná todos los aspectos de tu negocio</p>
      </header>

      <div className="w-full space-y-10">
        {/* Fila Superior: Lado a Lado en Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
          {/* Columna Izquierda: Acciones Rápidas */}
          {rapidasCards.length > 0 && (
            <div className="w-full">
              <h2 className="text-lg font-bold tracking-tight mb-4 text-left border-b border-gray-800 pb-2 text-[var(--foreground)]/80">
                Acciones Rápidas
              </h2>
              <div className="grid grid-cols-2 gap-4 md:gap-6 w-full">
                {rapidasCards.map(renderCard)}
              </div>
            </div>
          )}

          {/* Columna Derecha: Agenda y Ventas */}
          {agendaVentasCards.length > 0 && (
            <div className="w-full">
              <h2 className="text-lg font-bold tracking-tight mb-4 text-left border-b border-gray-800 pb-2 text-[var(--foreground)]/80">
                Agenda y Ventas
              </h2>
              <div className="grid grid-cols-2 gap-4 md:gap-6 w-full">
                {agendaVentasCards.map(renderCard)}
              </div>
            </div>
          )}
        </div>

        {/* Fila Inferior: Administración del Local (Ancho completo) */}
        {adminLocalCards.length > 0 && (
          <div className="w-full">
            <h2 className="text-lg font-bold tracking-tight mb-4 text-left border-b border-gray-800 pb-2 text-[var(--foreground)]/80">
              Administración del Local
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 w-full">
              {adminLocalCards.map(renderCard)}
            </div>
          </div>
        )}
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
