"use client";

import { useState, useEffect, useMemo } from "react";
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
import AdminSidebar, { AdminSection, AdminModules } from "@/components/admin/sections/AdminSidebar";
import { APP_VERSION } from "@/lib/version";
import { PRODUCT_NAME } from "@/lib/brand";

const VALID_SECTIONS: readonly AdminSection[] = [
  "metricas",
  "finanzas",
  "finanzas-liquidaciones",
  "finanzas-gastos",
  "turnos",
  "ventas",
  "facturas",
  "facturacion-config",
  "barberos",
  "config-identidad",
  "config-horarios",
  "config-contacto",
  "config-pagos",
  "config-resenas",
];

export function normalizeTab(raw: string | null, fallback: AdminSection = "metricas"): AdminSection {
  if (raw === "facturacion") return "facturas";
  if (raw && (VALID_SECTIONS as readonly string[]).includes(raw)) {
    return raw as AdminSection;
  }
  return fallback;
}

// Sections (Lazy Loaded on Demand with matching High-Fidelity Skeletons)
const DashboardClient = dynamic(() => import("@/app/dashboard/DashboardClient"), {
  loading: () => <DashboardSkeleton />,
});
const FinanzasSection = dynamic(() => import("@/components/admin/sections/FinanzasSection"), {
  loading: () => <SectionSkeleton />,
});
const LiquidacionesSection = dynamic(() => import("@/components/admin/sections/LiquidacionesSection"), {
  loading: () => <SectionSkeleton />,
});
const GastosSection = dynamic(() => import("@/components/admin/sections/GastosSection"), {
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
const ConfigResenasSection = dynamic(() => import("@/components/admin/sections/ConfigResenasSection"), {
  loading: () => <ConfigFormSkeleton />,
});

export default function AdminClient({ barbers }: Readonly<{ barbers: Barber[] }>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { role, user, isLoadingAuth } = useAuth();
  const { isEnabled, limits } = useBusinessContext();
  const isAdmin = role === "admin";
  const activeBarbers = useMemo(() => barbers.filter((b) => b.active !== false), [barbers]);
  const modules: AdminModules = {
    metrics: isEnabled("metrics"),
    sales: isEnabled("sales"),
    finances: isEnabled("finances"),
    commissionPayouts: isEnabled("commission_payouts"),
    expenses: isEnabled("expenses"),
    staffManagement: isEnabled("staff_management"),
    paymentMethods: limits.maxPaymentMethods > 0,
    arca: isEnabled("arca"),
    googleReviews: isEnabled("google_reviews"),
  };
  // Sin métricas en el plan, el panel arranca en la gestión de turnos
  const defaultSection: AdminSection = modules.metrics ? "metricas" : "turnos";

  const tabParam = searchParams.get("tab");
  const initialTab = tabParam ? normalizeTab(tabParam, defaultSection) : defaultSection;
  const [activeSection, setActiveSection] = useState<AdminSection>(initialTab);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Sincronizar sección si cambia el query param (ej: navegación adelante/atrás del navegador).
  // No depende de activeSection: si lo hiciera, un click volvería a la sección anterior
  // antes de que la URL se actualice.
  useEffect(() => {
    const rawTab = searchParams.get("tab");
    setActiveSection(rawTab ? normalizeTab(rawTab, defaultSection) : defaultSection);
  }, [searchParams, defaultSection]);

  // Protección de rol: redirigir a inicio si no es usuario autenticado
  useEffect(() => {
    if (!isLoadingAuth && role === "guest" && !user) {
      router.replace("/");
    }
  }, [role, user, isLoadingAuth, router]);

  // Una sección que el plan no incluye (ej. un link viejo a ?tab=metricas) cae a la sección por defecto
  const sectionAvailable: Record<AdminSection, boolean> = {
    metricas: modules.metrics,
    finanzas: modules.finances,
    "finanzas-liquidaciones": modules.commissionPayouts,
    "finanzas-gastos": modules.expenses,
    turnos: true,
    ventas: modules.sales,
    facturas: modules.arca,
    "facturacion-config": modules.arca,
    barberos: modules.staffManagement,
    "config-identidad": true,
    "config-horarios": true,
    "config-contacto": true,
    "config-pagos": modules.paymentMethods,
    "config-resenas": modules.googleReviews,
  };
  const visibleSection = sectionAvailable[activeSection] ? activeSection : defaultSection;

  const handleSelectSection = (section: AdminSection) => {
    setActiveSection(section);
    // Shallow routing: actualiza la URL y useSearchParams sin volver a pedir la página al servidor
    window.history.replaceState(null, "", `/admin?tab=${section}`);
  };

  return (
    <div
      style={{ minHeight: "calc(100vh - var(--navbar-height, 105px))" }}
      className="w-full flex flex-col lg:flex-row bg-[var(--background)]"
    >
      {/* Columna Izquierda / Barra de pestañas mobile: Menú lateral con scroll independiente en desktop y barra fija en mobile */}
      <aside
        className={`admin-sidebar-aside w-full flex-shrink-0 transition-all duration-300 ease-in-out flex flex-col ${
          isSidebarCollapsed ? "lg:w-16" : "lg:w-64 xl:w-72"
        }`}
      >
        <AdminSidebar
          activeSection={visibleSection}
          onSelectSection={handleSelectSection}
          isAdmin={isAdmin}
          modules={modules}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        />
      </aside>

      {/* Columna Derecha: Canvas de Contenido Dinámico (ocupa todo el ancho disponible) */}
      <section
        style={{ minHeight: "calc(100vh - var(--navbar-height, 105px))" }}
        className="flex-1 min-w-0 w-full overflow-y-auto px-4 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10"
      >
        <div className="w-full max-w-[1720px] mx-auto">
          {visibleSection === "metricas" && <DashboardClient initialBarbers={activeBarbers} />}
          {visibleSection === "finanzas" && isAdmin && <FinanzasSection barbers={barbers} />}
          {visibleSection === "finanzas-liquidaciones" && isAdmin && (
            <LiquidacionesSection barbers={barbers} />
          )}
          {visibleSection === "finanzas-gastos" && isAdmin && (
            <GastosSection barbers={barbers} />
          )}
          {visibleSection === "turnos" && <TurnosSection />}
          {visibleSection === "ventas" && <VentasSection />}
          {visibleSection === "facturas" && isAdmin && (
            <FacturasSection />
          )}
          {visibleSection === "facturacion-config" && isAdmin && (
            <ArcaConfigSection />
          )}
          {visibleSection === "barberos" && isAdmin && <AdminBarberosClient barbers={barbers} />}

          {/* Secciones de Configuración Directas en Pantalla */}
          {visibleSection === "config-identidad" && isAdmin && <ConfigIdentidadSection />}
          {visibleSection === "config-horarios" && isAdmin && <ConfigHorariosSection />}
          {visibleSection === "config-contacto" && isAdmin && <ConfigContactoSection />}
          {visibleSection === "config-pagos" && isAdmin && <ConfigPagosSection />}
          {visibleSection === "config-resenas" && isAdmin && (
            <ConfigResenasSection />
          )}

          {/* Footer mobile visible solo en pantallas pequeñas */}
          <div className="lg:hidden flex items-center justify-center gap-2 pt-8 pb-4 border-t border-white/5 text-[11px] text-slate-500 font-mono">
            <span>{PRODUCT_NAME}</span>
            <span>•</span>
            <span>v{APP_VERSION}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
