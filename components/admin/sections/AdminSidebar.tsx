"use client";

import { useState } from "react";
import {
  TrendingUp,
  Calendar,
  ShoppingBag,
  FileText,
  Users,
  Store,
  Clock,
  MessageCircle,
  CreditCard,
  Settings,
  ChevronDown,
  Coins,
  Receipt,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Star,
  Package,
  Scissors,
  UserCircle,
  Wallet,
} from "lucide-react";
import { APP_VERSION } from "@/lib/version";
import { PRODUCT_NAME } from "@/lib/brand";

export type AdminSection =
  | "metricas"
  | "finanzas"
  | "finanzas-liquidaciones"
  | "finanzas-gastos"
  | "caja"
  | "turnos"
  | "ventas"
  | "facturas"
  | "facturacion-config"
  | "barberos"
  | "productos"
  | "servicios"
  | "mi-perfil"
  | "config-identidad"
  | "config-horarios"
  | "config-contacto"
  | "config-pagos"
  | "config-resenas";

/** Módulos habilitados por el plan del cliente (ver PLAN_FEATURES en lib/flags). */
export interface AdminModules {
  metrics: boolean;
  sales: boolean;
  finances: boolean;
  commissionPayouts: boolean;
  expenses: boolean;
  staffManagement: boolean;
  paymentMethods: boolean;
  arca: boolean;
  googleReviews: boolean;
  cashRegister: boolean;
  cashClosing: boolean;
}

export interface NavItem {
  section: AdminSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  visible: (modules: AdminModules, isAdmin: boolean) => boolean;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "metricas",
    label: "Resumen",
    items: [
      {
        section: "metricas",
        label: "Resumen",
        icon: TrendingUp,
        visible: (modules) => modules.metrics,
      },
    ],
  },
  {
    id: "finanzas",
    label: "Finanzas",
    items: [
      {
        section: "finanzas",
        label: "Balance",
        icon: Coins,
        visible: (modules, isAdmin) => isAdmin && modules.finances,
      },
      {
        section: "finanzas-liquidaciones",
        label: "Liquidaciones",
        icon: Receipt,
        visible: (modules, isAdmin) => isAdmin && modules.commissionPayouts,
      },
      {
        section: "finanzas-gastos",
        label: "Gastos",
        icon: TrendingDown,
        visible: (modules, isAdmin) => isAdmin && modules.expenses,
      },
    ],
  },
  {
    id: "operaciones",
    label: "Operaciones",
    items: [
      {
        section: "caja",
        label: "Caja",
        icon: Wallet,
        visible: (modules, isAdmin) => isAdmin && modules.cashRegister,
      },
      {
        section: "turnos",
        label: "Turnos",
        icon: Calendar,
        visible: () => true,
      },
      {
        section: "ventas",
        label: "Ventas",
        icon: ShoppingBag,
        visible: (modules) => modules.sales,
      },
      {
        section: "productos",
        label: "Productos",
        icon: Package,
        visible: (_modules, isAdmin) => isAdmin,
      },
      {
        section: "servicios",
        label: "Servicios",
        icon: Scissors,
        visible: (_modules, isAdmin) => isAdmin,
      },
      {
        section: "barberos",
        label: "Barberos",
        icon: Users,
        visible: (modules, isAdmin) => isAdmin && modules.staffManagement,
      },
    ],
  },
  {
    id: "arca",
    label: "Facturación ARCA",
    items: [
      {
        section: "facturas",
        label: "Comprobantes",
        icon: FileText,
        visible: (modules, isAdmin) => isAdmin && modules.arca,
      },
      {
        section: "facturacion-config",
        label: "Configuración ARCA",
        icon: Settings,
        visible: (modules, isAdmin) => isAdmin && modules.arca,
      },
    ],
  },
  {
    id: "configuracion",
    label: "Configuración",
    items: [
      {
        section: "config-identidad",
        label: "Identidad y marca",
        icon: Store,
        visible: (_modules, isAdmin) => isAdmin,
      },
      {
        section: "config-horarios",
        label: "Horarios y reservas",
        icon: Clock,
        visible: (_modules, isAdmin) => isAdmin,
      },
      {
        section: "config-contacto",
        label: "Contacto y canales",
        icon: MessageCircle,
        visible: (_modules, isAdmin) => isAdmin,
      },
      {
        section: "config-pagos",
        label: "Cobros y caja",
        icon: CreditCard,
        visible: (modules, isAdmin) => isAdmin && modules.paymentMethods,
      },
      {
        section: "config-resenas",
        label: "Reseñas de Google",
        icon: Star,
        visible: (modules, isAdmin) => isAdmin && modules.googleReviews,
      },
    ],
  },
  {
    id: "cuenta",
    label: "Cuenta",
    items: [
      {
        section: "mi-perfil",
        label: "Mi perfil",
        icon: UserCircle,
        visible: () => true,
      },
    ],
  },
];

interface Props {
  activeSection: AdminSection;
  onSelectSection: (section: AdminSection) => void;
  isAdmin: boolean;
  modules: AdminModules;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function AdminSidebar({
  activeSection,
  onSelectSection,
  isAdmin,
  modules,
  isCollapsed = false,
  onToggleCollapse,
}: Readonly<Props>) {
  // Estado para colapsar/desplegar categorías internas. Por defecto: TODOS VISIBLES (false = no colapsado)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const navItemClass = (section: AdminSection) => {
    const isActive = activeSection === section;

    if (isCollapsed) {
      return `w-full flex items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
        isActive
          ? "!bg-[var(--accent)]/20 !text-[var(--accent)] !border !border-[var(--accent)]/40 shadow-sm"
          : "!bg-transparent !text-slate-400 hover:!text-white hover:!bg-white/5 !border !border-transparent"
      }`;
    }

    return `w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
      isActive
        ? "!bg-[var(--accent)]/15 !text-[var(--accent)] !border !border-[var(--accent)]/30 font-semibold shadow-sm"
        : "!bg-transparent !text-slate-400 hover:!text-white hover:!bg-white/5 !border !border-transparent"
    }`;
  };

  return (
    <>
      {/* VERSIÓN MOBILE: Barra de pestañas horizontal deslizable */}
      <div className="lg:hidden w-full overflow-x-auto py-2.5 px-3 flex items-center gap-1.5 no-scrollbar">
        {NAV_GROUPS.flatMap((g) => g.items)
          .filter((item) => item.visible(modules, isAdmin))
          .map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.section;
            return (
              <button
                key={item.section}
                type="button"
                onClick={() => onSelectSection(item.section)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium transition-all min-h-[44px] cursor-pointer ${
                  isActive
                    ? "!bg-[var(--accent)] !text-slate-950 font-bold"
                    : "!bg-white/5 !text-slate-300 hover:!text-white hover:!bg-white/10"
                }`}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
      </div>

      {/* VERSIÓN DESKTOP: Menú lateral con footer fijo y scroll independiente */}
      <div className={`hidden lg:flex flex-col w-full h-full min-h-0 pt-3 pb-2.5 ${isCollapsed ? "px-1.5" : "px-3"} overflow-hidden select-none`}>
        {/* Cabecera del Sidebar (Fija superior) */}
        <div className={`flex-shrink-0 pb-3 mb-2 border-b border-white/10 ${isCollapsed ? "px-1 flex flex-col items-center" : "px-2"}`}>
          {!isCollapsed ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <h2 className="text-xs font-bold text-white tracking-tight truncate">
                  Administración
                </h2>
                <span className="text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/20 flex-shrink-0">
                  {isAdmin ? "Admin" : "Barbero"}
                </span>
              </div>
              {onToggleCollapse && (
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex-shrink-0"
                  title="Colapsar menú"
                  aria-label="Colapsar menú"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center w-full"
                title="Expandir menú"
                aria-label="Expandir menú"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )
          )}
          {!isCollapsed && (
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">
              {isAdmin ? "Configuración y control global" : "Tus turnos y balance"}
            </p>
          )}
        </div>

        {/* Lista de navegación (Única parte scrolleable si crece) */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-0.5 no-scrollbar">
          {NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter((item) => item.visible(modules, isAdmin));
            if (visibleItems.length === 0) return null;

            // Si un grupo tiene un solo ítem visible, se muestra como ítem suelto (sin plegable)
            if (visibleItems.length === 1) {
              const item = visibleItems[0];
              const Icon = item.icon;
              return (
                <div key={group.id} className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => onSelectSection(item.section)}
                    className={navItemClass(item.section)}
                    title={item.label}
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </button>
                </div>
              );
            }

            const isGroupCollapsed = collapsedGroups[group.id] ?? false;

            return (
              <div key={group.id}>
                {!isCollapsed ? (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-bold text-slate-400 hover:text-slate-200 tracking-wider rounded transition-colors group cursor-pointer select-none"
                  >
                    <span>{group.label}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-transform duration-200 ${
                        isGroupCollapsed ? "-rotate-90" : "rotate-0"
                      }`}
                    />
                  </button>
                ) : (
                  <div className="h-px bg-white/5 my-1 mx-1" />
                )}

                {(!isGroupCollapsed || isCollapsed) && (
                  <div className="space-y-0.5 mt-0.5">
                    {visibleItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.section}
                          type="button"
                          onClick={() => onSelectSection(item.section)}
                          className={navItemClass(item.section)}
                          title={item.label}
                        >
                          <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                          {!isCollapsed && <span>{item.label}</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer fijo: producto y versión */}
        <div className={`flex-shrink-0 pt-2.5 pb-0.5 mt-auto border-t border-white/10 px-1 flex items-center ${isCollapsed ? "justify-center" : "justify-end"}`}>
          <span
            className="text-[10px] font-mono text-slate-500 truncate"
            title={`${PRODUCT_NAME} v${APP_VERSION}`}
          >
            {isCollapsed ? `v${APP_VERSION}` : `${PRODUCT_NAME} v${APP_VERSION}`}
          </span>
        </div>
      </div>
    </>
  );
}
