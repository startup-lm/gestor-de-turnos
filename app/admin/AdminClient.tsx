"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Barber } from "@/lib/types/Barbers";
import { useAuth } from "@/lib/auth/AuthContext";
import { useBusinessContext } from "@/lib/context/BusinessContext";

import dynamic from "next/dynamic";
import {
  SectionSkeleton,
  DashboardSkeleton,
  AppointmentsTableSkeleton,
  SalesTableSkeleton,
  ArcaSkeleton,
  BarbersGridSkeleton,
  ConfigFormSkeleton,
} from "@/components/loading/Skeleton";

// Modular Sidebar
import AdminSidebar, { AdminSection } from "@/components/admin/sections/AdminSidebar";

// Sections (Lazy Loaded on Demand with matching High-Fidelity Skeletons)
const DashboardClient = dynamic(() => import("@/app/dashboard/DashboardClient"), {
  loading: () => <DashboardSkeleton />,
});
const FinanzasSection = dynamic(() => import("@/components/admin/sections/FinanzasSection"), {
  loading: () => <SectionSkeleton />,
});
const TurnosSection = dynamic(() => import("@/components/admin/sections/TurnosSection"), {
  loading: () => <AppointmentsTableSkeleton />,
});
const VentasSection = dynamic(() => import("@/components/admin/sections/VentasSection"), {
  loading: () => <SalesTableSkeleton />,
});
const FacturasSection = dynamic(() => import("@/components/admin/sections/FacturasSection"), {
  loading: () => <ArcaSkeleton />,
});
const ArcaConfigSection = dynamic(() => import("@/components/admin/sections/ArcaConfigSection"), {
  loading: () => <ConfigFormSkeleton />,
});
const AdminBarberosClient = dynamic(() => import("@/app/operaciones/barberos/AdminBarberosClient"), {
  loading: () => <BarbersGridSkeleton />,
});
const ConfigIdentidadSection = dynamic(() => import("@/components/admin/sections/ConfigIdentidadSection"), {
  loading: () => <ConfigFormSkeleton />,
});
const ConfigHorariosSection = dynamic(() => import("@/components/admin/sections/ConfigHorariosSection"), {
  loading: () => <ConfigFormSkeleton />,
});
const ConfigContactoSection = dynamic(() => import("@/components/admin/sections/ConfigContactoSection"), {
  loading: () => <ConfigFormSkeleton />,
});
const ConfigPagosSection = dynamic(() => import("@/components/admin/sections/ConfigPagosSection"), {
  loading: () => <ConfigFormSkeleton />,
});

export default function AdminClient({ barbers }: Readonly<{ barbers: Barber[] }>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { role, user, isLoadingAuth } = useAuth();
  const { isEnabled } = useBusinessContext();
  const isAdmin = role === "admin";
  const arcaEnabled = isEnabled("arca");

  const tabParam = searchParams.get("tab") as AdminSection | null;
  const initialTab = tabParam === "facturacion" ? "facturas" : tabParam || "metricas";
  const [activeSection, setActiveSection] = useState<AdminSection>(initialTab);

  // Sincronizar sección si cambia el query param (ej: navegación adelante/atrás del navegador)
  useEffect(() => {
    const rawTab = (searchParams.get("tab") as AdminSection | null) || "metricas";
    const currentTab = rawTab === "facturacion" ? "facturas" : rawTab;
    if (currentTab !== activeSection) {
      setActiveSection(currentTab);
    }
  }, [searchParams, activeSection]);

  // Protección de rol: redirigir a inicio si no es usuario autenticado
  useEffect(() => {
    if (!isLoadingAuth && role === "guest" && !user) {
      router.replace("/");
    }
  }, [role, user, isLoadingAuth, router]);

  const handleSelectSection = (section: AdminSection) => {
    const targetSection = section === "facturacion" ? "facturas" : section;
    setActiveSection(targetSection);
    router.replace(`/admin?tab=${targetSection}`, { scroll: false });
  };

  return (
    <div className="w-full min-h-[calc(100vh-64px)] flex flex-col lg:flex-row bg-[var(--background)]">
      {/* Columna Izquierda: Menú Lateral estilo Supabase */}
      <aside className="w-full lg:w-64 xl:w-72 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-white/10 bg-[#0B132B]/40 lg:min-h-[calc(100vh-64px)] lg:sticky lg:top-[64px] lg:self-start lg:h-[calc(100vh-64px)] overflow-y-auto z-20">
        <AdminSidebar
          activeSection={activeSection}
          onSelectSection={handleSelectSection}
          isAdmin={isAdmin}
          arcaEnabled={arcaEnabled}
        />
      </aside>

      {/* Columna Derecha: Canvas de Contenido Dinámico (ocupa todo el ancho disponible) */}
      <main className="flex-1 min-w-0 w-full min-h-[calc(100vh-64px)] overflow-y-auto px-4 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
        <div className="w-full max-w-[1720px] mx-auto">
          {activeSection === "metricas" && <DashboardClient initialBarbers={barbers} />}
          {activeSection === "finanzas" && isAdmin && <FinanzasSection barbers={barbers} />}
          {activeSection === "turnos" && <TurnosSection />}
          {activeSection === "ventas" && <VentasSection />}
          {(activeSection === "facturas" || activeSection === "facturacion") && arcaEnabled && isAdmin && (
            <FacturasSection />
          )}
          {activeSection === "facturacion-config" && arcaEnabled && isAdmin && (
            <ArcaConfigSection />
          )}
          {activeSection === "barberos" && isAdmin && <AdminBarberosClient barbers={barbers} />}

          {/* Secciones de Configuración Directas en Pantalla */}
          {activeSection === "config-identidad" && isAdmin && <ConfigIdentidadSection />}
          {activeSection === "config-horarios" && isAdmin && <ConfigHorariosSection />}
          {activeSection === "config-contacto" && isAdmin && <ConfigContactoSection />}
          {activeSection === "config-pagos" && isAdmin && <ConfigPagosSection />}
        </div>
      </main>
    </div>
  );
}
