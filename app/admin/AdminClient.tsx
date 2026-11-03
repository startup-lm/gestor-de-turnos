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
import {
  useResizableSidebar,
  SIDEBAR_COLLAPSED_WIDTH,
  SIDEBAR_MAX_WIDTH,
} from "@/lib/hooks/useResizableSidebar";
import { APP_VERSION } from "@/lib/version";
import { PRODUCT_NAME } from "@/lib/brand";

const VALID_SECTIONS: readonly AdminSection[] = [
  "metricas",
  "finanzas",
  "finanzas-liquidaciones",
  "finanzas-gastos",
  "turnos",
  "caja",
  "ventas",
  "facturas",
  "facturacion-config",
  "barberos",
  "productos",
  "servicios",
  "mi-perfil",
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
const MetricasSection = dynamic(() => import("@/components/admin/sections/MetricasSection"), {
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
const BarberosSection = dynamic(() => import("@/components/admin/sections/BarberosSection"), {
  loading: () => <BarbersGridSkeleton />,
});
const CajaSection = dynamic(() => import("@/components/admin/sections/CajaSection"), {
  loading: () => <SectionSkeleton />,
});
const ProductosSection = dynamic(() => import("@/components/admin/sections/ProductosSection"), {
  loading: () => <SectionSkeleton />,
});
const ServiciosSection = dynamic(() => import("@/components/admin/sections/ServiciosSection"), {
  loading: () => <SectionSkeleton />,
});
const MiPerfilSection = dynamic(() => import("@/components/admin/sections/MiPerfilSection"), {
  loading: () => <SectionSkeleton />,
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

export default function AdminClient({ barbers, me }: Readonly<{ barbers: Barber[]; me: Barber | null }>) {
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
    paymentMethods: isEnabled("custom_payment_methods") && limits.maxPaymentMethods > 0,
    arca: isEnabled("arca"),
    googleReviews: isEnabled("google_reviews"),
    cashRegister: isEnabled("cash_register"),
  };
  // Sin métricas en el plan, el panel arranca en la gestión de turnos
  const defaultSection: AdminSection = modules.metrics ? "metricas" : "turnos";

  const tabParam = searchParams.get("tab");
  const initialTab = tabParam ? normalizeTab(tabParam, defaultSection) : defaultSection;
  const [activeSection, setActiveSection] = useState<AdminSection>(initialTab);
  const sidebar = useResizableSidebar();

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
    caja: modules.cashRegister,
    turnos: true,
    ventas: modules.sales,
    facturas: modules.arca,
    "facturacion-config": modules.arca,
    barberos: modules.staffManagement,
    productos: true,
    servicios: true,
    "mi-perfil": true,
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
        style={{ "--admin-sidebar-width": `${sidebar.width}px` } as React.CSSProperties}
        className={`admin-sidebar-aside w-full flex-shrink-0 flex flex-col ${
          sidebar.isDragging ? "" : "transition-all duration-300 ease-in-out"
        } ${sidebar.isCollapsed ? "lg:w-16" : "lg:w-[var(--admin-sidebar-width)]"}`}
      >
        <AdminSidebar
          activeSection={visibleSection}
          onSelectSection={handleSelectSection}
          isAdmin={isAdmin}
          modules={modules}
          isCollapsed={sidebar.isCollapsed}
          onToggleCollapse={sidebar.toggleCollapsed}
        />

        {/* Manija para ajustar el ancho (solo desktop). El aside es sticky, así que sirve de referencia al absolute */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Ajustar ancho del menú"
          aria-valuenow={sidebar.isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : sidebar.width}
          aria-valuemin={SIDEBAR_COLLAPSED_WIDTH}
          aria-valuemax={SIDEBAR_MAX_WIDTH}
          tabIndex={0}
          title="Arrastrá para ajustar el ancho. Doble clic para restablecerlo"
          {...sidebar.handleProps}
          className="group hidden lg:flex justify-end absolute top-0 right-0 z-30 h-full w-2 cursor-col-resize touch-none focus-visible:outline-none"
        >
          <div
            className={`h-full w-0.5 transition-colors ${
              sidebar.isDragging
                ? "bg-[var(--accent)]"
                : "bg-transparent group-hover:bg-[var(--accent)]/60 group-focus-visible:bg-[var(--accent)]"
            }`}
          />
        </div>
      </aside>

      {/* Columna Derecha: Canvas de Contenido Dinámico (ocupa todo el ancho disponible) */}
      <section
        style={{ minHeight: "calc(100vh - var(--navbar-height, 105px))" }}
        className="flex-1 min-w-0 w-full overflow-y-auto px-4 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10"
      >
        <div className="w-full max-w-[1720px] mx-auto">
          {visibleSection === "metricas" && <MetricasSection initialBarbers={activeBarbers} />}
          {visibleSection === "finanzas" && isAdmin && <FinanzasSection barbers={barbers} />}
          {visibleSection === "finanzas-liquidaciones" && isAdmin && (
            <LiquidacionesSection barbers={barbers} />
          )}
          {visibleSection === "finanzas-gastos" && isAdmin && (
            <GastosSection barbers={barbers} />
          )}
          {visibleSection === "caja" && <CajaSection />}
          {visibleSection === "turnos" && <TurnosSection />}
          {visibleSection === "ventas" && <VentasSection />}
          {visibleSection === "facturas" && isAdmin && (
            <FacturasSection />
          )}
          {visibleSection === "facturacion-config" && isAdmin && (
            <ArcaConfigSection />
          )}
          {visibleSection === "barberos" && isAdmin && <BarberosSection barbers={barbers} />}
          {visibleSection === "productos" && isAdmin && <ProductosSection />}
          {visibleSection === "servicios" && isAdmin && <ServiciosSection />}
          {visibleSection === "mi-perfil" && me && <MiPerfilSection barber={me} />}

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
