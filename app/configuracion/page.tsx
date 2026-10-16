"use client";

import { useState } from "react";
import {
  Clock,
  MessageCircle,
  CreditCard,
  Share2,
  BookOpen,
  MapPin,
  Image as ImageIcon,
  Shuffle,
  Store,
  Palette,
} from "lucide-react";
import WhatsAppSettingsModal from "@/components/admin/WhatsAppSettingsModal";
import PaymentSettingsModal from "@/components/admin/PaymentSettingsModal";
import BusinessHoursModal from "@/components/admin/BusinessHoursModal";
import SocialMediaSettingsModal from "@/components/admin/SocialMediaSettingsModal";
import OurStorySettingsModal from "@/components/admin/OurStorySettingsModal";
import LocationSettingsModal from "@/components/admin/LocationSettingsModal";
import LocalPhotoSettingsModal from "@/components/admin/LocalPhotoSettingsModal";
import AssignmentSettingsModal from "@/components/admin/AssignmentSettingsModal";
import BrandingSettingsModal from "@/components/admin/BrandingSettingsModal";
import ThemeSettingsModal from "@/components/admin/ThemeSettingsModal";

type ConfigModalType =
  | "whatsapp"
  | "payments"
  | "hours"
  | "social"
  | "story"
  | "location"
  | "local_photo"
  | "assignment"
  | "branding"
  | "theme"
  | null;

interface ConfigCard {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}

export default function ConfiguracionPage() {
  const [activeModal, setActiveModal] = useState<ConfigModalType>(null);

  const identityCards: ConfigCard[] = [
    {
      label: "Nombre y Logo",
      description: "Nombre y logo del local",
      icon: Store,
      onClick: () => setActiveModal("branding"),
    },
    {
      label: "Diseño y Colores",
      description: "Personalizar colores",
      icon: Palette,
      onClick: () => setActiveModal("theme"),
    },
    {
      label: "Foto Local",
      description: "Fachada del local",
      icon: ImageIcon,
      onClick: () => setActiveModal("local_photo"),
    },
    {
      label: "Historia",
      description: "Texto Nosotros",
      icon: BookOpen,
      onClick: () => setActiveModal("story"),
    },
  ];

  const scheduleCards: ConfigCard[] = [
    {
      label: "Horarios",
      description: "Días de atención",
      icon: Clock,
      onClick: () => setActiveModal("hours"),
    },
    {
      label: "Asignación",
      description: "Criterio de asignación",
      icon: Shuffle,
      onClick: () => setActiveModal("assignment"),
    },
  ];

  const contactCards: ConfigCard[] = [
    {
      label: "WhatsApp",
      description: "Teléfono del local",
      icon: MessageCircle,
      onClick: () => setActiveModal("whatsapp"),
    },
    {
      label: "Ubicación",
      description: "Dirección en mapa",
      icon: MapPin,
      onClick: () => setActiveModal("location"),
    },
    {
      label: "Redes",
      description: "Links de RRSS",
      icon: Share2,
      onClick: () => setActiveModal("social"),
    },
    {
      label: "Medios de Pago",
      description: "Métodos aceptados",
      icon: CreditCard,
      onClick: () => setActiveModal("payments"),
    },
  ];

  const renderCard = (item: ConfigCard) => (
    <button
      key={item.label}
      onClick={item.onClick}
      className="relative flex flex-col items-center justify-center p-6 md:p-8 rounded-2xl text-center transition-all duration-300 group overflow-hidden border shadow-md hover:-translate-y-1 hover:shadow-lg w-full !bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 hover:!bg-[var(--foreground)]/10 hover:!border-[var(--accent)]/40 cursor-pointer"
    >
      <div className="mb-4 p-4 rounded-full transition-transform duration-300 group-hover:scale-110 bg-[var(--foreground)]/5">
        <item.icon className="w-8 h-8 !text-[var(--foreground)]/70 group-hover:!text-[var(--accent)]" />
      </div>
      <h3 className="text-lg md:text-xl font-bold mb-1 !text-[var(--foreground)]">{item.label}</h3>
      <p className="text-xs md:text-sm font-medium !text-gray-500 dark:!text-gray-400">
        {item.description}
      </p>
    </button>
  );

  return (
    <div className="flex flex-col items-center p-6 min-h-[calc(100vh-64px)] w-full max-w-6xl mx-auto">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-[var(--foreground)] via-[var(--foreground)] to-[var(--accent)] bg-clip-text text-transparent">
          Configuración
        </h1>
        <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">
          Personalización, reglas del negocio y datos de contacto
        </p>
      </header>

      <div className="w-full space-y-10">
        {/* Sección 1: Identidad y Marca */}
        <div className="w-full">
          <h2 className="text-lg font-bold tracking-tight mb-4 text-left border-b border-gray-800 pb-2 text-[var(--foreground)]/80">
            Identidad y Marca
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full">
            {identityCards.map(renderCard)}
          </div>
        </div>

        {/* Sección 2: Atención y Agenda */}
        <div className="w-full">
          <h2 className="text-lg font-bold tracking-tight mb-4 text-left border-b border-gray-800 pb-2 text-[var(--foreground)]/80">
            Atención y Agenda
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full">
            {scheduleCards.map(renderCard)}
          </div>
        </div>

        {/* Sección 3: Contacto y Canales */}
        <div className="w-full">
          <h2 className="text-lg font-bold tracking-tight mb-4 text-left border-b border-gray-800 pb-2 text-[var(--foreground)]/80">
            Contacto y Canales
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full">
            {contactCards.map(renderCard)}
          </div>
        </div>
      </div>

      {activeModal === "whatsapp" && <WhatsAppSettingsModal onClose={() => setActiveModal(null)} />}
      {activeModal === "payments" && <PaymentSettingsModal onClose={() => setActiveModal(null)} />}
      {activeModal === "hours" && <BusinessHoursModal onClose={() => setActiveModal(null)} />}
      {activeModal === "social" && <SocialMediaSettingsModal onClose={() => setActiveModal(null)} />}
      {activeModal === "story" && <OurStorySettingsModal onClose={() => setActiveModal(null)} />}
      {activeModal === "location" && <LocationSettingsModal onClose={() => setActiveModal(null)} />}
      {activeModal === "local_photo" && <LocalPhotoSettingsModal onClose={() => setActiveModal(null)} />}
      {activeModal === "assignment" && <AssignmentSettingsModal onClose={() => setActiveModal(null)} />}
      {activeModal === "branding" && <BrandingSettingsModal onClose={() => setActiveModal(null)} />}
      {activeModal === "theme" && <ThemeSettingsModal onClose={() => setActiveModal(null)} />}
    </div>
  );
}
