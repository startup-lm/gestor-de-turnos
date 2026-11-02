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
  ShieldCheck,
  Settings,
  ChevronDown,
  Coins,
  Receipt,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Star,
} from "lucide-react";
import { APP_VERSION } from "@/lib/version";
import { PRODUCT_NAME } from "@/lib/brand";

export type AdminSection =
  | "metricas"
  | "finanzas"
  | "finanzas-liquidaciones"
  | "finanzas-gastos"
  | "turnos"
  | "ventas"
  | "facturas"
  | "facturacion"
  | "facturacion-config"
  | "barberos"
  | "config-identidad"
  | "config-horarios"
  | "config-contacto"
  | "config-pagos"
  | "config-resenas";

type ModuleCategory =
  | "principal"
  | "finanzas"
  | "operaciones"
  | "facturacion"
  | "configuracion";

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
}

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
  const { arca: arcaEnabled, googleReviews: googleReviewsEnabled } = modules;
  const hasFinanceModules = modules.finances || modules.commissionPayouts || modules.expenses;
  // Estado para colapsar/desplegar categorías internas. Por defecto: TODOS VISIBLES (false = no colapsado)
  const [collapsedCategories, setCollapsedCategories] = useState<Record<ModuleCategory, boolean>>({
    principal: false,
    finanzas: false,
    operaciones: false,
    facturacion: false,
    configuracion: false,
  });

  const toggleCategory = (category: ModuleCategory) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const navItemClass = (section: AdminSection) => {
    const isActive =
      activeSection === section ||
      (section === "facturas" && activeSection === "facturacion") ||
      (section === "facturacion" && activeSection === "facturas");

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
        {modules.metrics && (
          <button
            type="button"
            onClick={() => onSelectSection("metricas")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium transition-all ${
              activeSection === "metricas"
                ? "!bg-[var(--accent)] !text-slate-950 font-bold"
                : "!bg-white/5 !text-slate-300"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Panel de control</span>
          </button>
        )}

        {isAdmin && modules.finances && (
          <button
            type="button"
            onClick={() => onSelectSection("finanzas")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium transition-all ${
              activeSection === "finanzas"
                ? "!bg-[var(--accent)] !text-slate-950 font-bold"
                : "!bg-white/5 !text-slate-300"
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Balance y liquidaciones</span>
          </button>
        )}

        {isAdmin && modules.commissionPayouts && (
          <button
            type="button"
            onClick={() => onSelectSection("finanzas-liquidaciones")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium transition-all ${
              activeSection === "finanzas-liquidaciones"
                ? "!bg-[var(--accent)] !text-slate-950 font-bold"
                : "!bg-white/5 !text-slate-300"
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Historial de pagos</span>
          </button>
        )}

        {isAdmin && modules.expenses && (
          <button
            type="button"
            onClick={() => onSelectSection("finanzas-gastos")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium transition-all ${
              activeSection === "finanzas-gastos"
                ? "!bg-[var(--accent)] !text-slate-950 font-bold"
                : "!bg-white/5 !text-slate-300"
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Gastos del local</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onSelectSection("turnos")}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium transition-all ${
            activeSection === "turnos"
              ? "!bg-[var(--accent)] !text-slate-950 font-bold"
              : "!bg-white/5 !text-slate-300"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Gestión de turnos</span>
        </button>

        {modules.sales && (
          <button
            type="button"
            onClick={() => onSelectSection("ventas")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium transition-all ${
              activeSection === "ventas"
                ? "!bg-[var(--accent)] !text-slate-950 font-bold"
                : "!bg-white/5 !text-slate-300"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Gestión de ventas</span>
          </button>
        )}

        {arcaEnabled && isAdmin && (
          <>
            <button
              type="button"
              onClick={() => onSelectSection("facturas")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium transition-all ${
                activeSection === "facturas" || activeSection === "facturacion"
                  ? "!bg-[var(--accent)] !text-slate-950 font-bold"
                  : "!bg-white/5 !text-slate-300"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Comprobantes</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectSection("facturacion-config")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium transition-all ${
                activeSection === "facturacion-config"
                  ? "!bg-[var(--accent)] !text-slate-950 font-bold"
                  : "!bg-white/5 !text-slate-300"
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Configuración ARCA</span>
            </button>
          </>
        )}

        {isAdmin && (
          <>
            {modules.staffManagement && (
              <button
                type="button"
                onClick={() => onSelectSection("barberos")}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium transition-all ${
                  activeSection === "barberos"
                    ? "!bg-[var(--accent)] !text-slate-950 font-bold"
                    : "!bg-white/5 !text-slate-300"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Gestión de barberos</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onSelectSection("config-identidad")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium transition-all ${
                activeSection === "config-identidad"
                  ? "!bg-[var(--accent)] !text-slate-950 font-bold"
                  : "!bg-white/5 !text-slate-300"
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Identidad y marca</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectSection("config-horarios")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium transition-all ${
                activeSection === "config-horarios"
                  ? "!bg-[var(--accent)] !text-slate-950 font-bold"
                  : "!bg-white/5 !text-slate-300"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Horarios y atención</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectSection("config-contacto")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium transition-all ${
                activeSection === "config-contacto"
                  ? "!bg-[var(--accent)] !text-slate-950 font-bold"
                  : "!bg-white/5 !text-slate-300"
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Contacto y canales</span>
            </button>

            {modules.paymentMethods && (
              <button
                type="button"
                onClick={() => onSelectSection("config-pagos")}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium transition-all ${
                  activeSection === "config-pagos"
                    ? "!bg-[var(--accent)] !text-slate-950 font-bold"
                    : "!bg-white/5 !text-slate-300"
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Medios de pago</span>
              </button>
            )}

            {googleReviewsEnabled && (
              <button
                type="button"
                onClick={() => onSelectSection("config-resenas")}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium transition-all ${
                  activeSection === "config-resenas"
                    ? "!bg-[var(--accent)] !text-slate-950 font-bold"
                    : "!bg-white/5 !text-slate-300"
                }`}
              >
                <Star className="w-3.5 h-3.5" />
                <span>Reseñas de Google</span>
              </button>
            )}
          </>
        )}
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
          {/* Módulo 1: Panel Principal */}
          <div>
            {!isCollapsed ? (
              <button
                type="button"
                onClick={() => toggleCategory("principal")}
                className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-bold text-slate-400 hover:text-slate-200 uppercase tracking-wider rounded transition-colors group cursor-pointer select-none"
              >
                <span>Panel principal</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-transform duration-200 ${
                    collapsedCategories.principal ? "-rotate-90" : "rotate-0"
                  }`}
                />
              </button>
            ) : (
              <div className="h-px bg-white/5 my-1 mx-1" />
            )}

            {(!collapsedCategories.principal || isCollapsed) && (
              <div className="space-y-0.5 mt-0.5">
                {modules.metrics && (
                  <button
                    type="button"
                    onClick={() => onSelectSection("metricas")}
                    className={navItemClass("metricas")}
                    title="Panel de control"
                  >
                    <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" />
                    {!isCollapsed && <span>Panel de control</span>}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Módulo 2: Finanzas y Caja (Solo Admin, si el plan incluye algún módulo de finanzas) */}
          {isAdmin && hasFinanceModules && (
            <div>
              {!isCollapsed ? (
                <button
                  type="button"
                  onClick={() => toggleCategory("finanzas")}
                  className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-bold text-slate-400 hover:text-slate-200 uppercase tracking-wider rounded transition-colors group cursor-pointer select-none"
                >
                  <span>Finanzas y caja</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-transform duration-200 ${
                      collapsedCategories.finanzas ? "-rotate-90" : "rotate-0"
                    }`}
                  />
                </button>
              ) : (
                <div className="h-px bg-white/5 my-1 mx-1" />
              )}

              {(!collapsedCategories.finanzas || isCollapsed) && (
                <div className="space-y-0.5 mt-0.5">
                  {modules.finances && (
                    <button
                      type="button"
                      onClick={() => onSelectSection("finanzas")}
                      className={navItemClass("finanzas")}
                      title="Balance y liquidaciones"
                    >
                      <Coins className="w-3.5 h-3.5 flex-shrink-0" />
                      {!isCollapsed && <span>Balance y liquidaciones</span>}
                    </button>
                  )}

                  {modules.commissionPayouts && (
                    <button
                      type="button"
                      onClick={() => onSelectSection("finanzas-liquidaciones")}
                      className={navItemClass("finanzas-liquidaciones")}
                      title="Historial de pagos"
                    >
                      <Receipt className="w-3.5 h-3.5 flex-shrink-0" />
                      {!isCollapsed && <span>Historial de pagos</span>}
                    </button>
                  )}

                  {modules.expenses && (
                    <button
                      type="button"
                      onClick={() => onSelectSection("finanzas-gastos")}
                      className={navItemClass("finanzas-gastos")}
                      title="Gastos del local"
                    >
                      <TrendingDown className="w-3.5 h-3.5 flex-shrink-0" />
                      {!isCollapsed && <span>Gastos del local</span>}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Módulo 3: Operaciones */}
          <div>
            {!isCollapsed ? (
              <button
                type="button"
                onClick={() => toggleCategory("operaciones")}
                className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-bold text-slate-400 hover:text-slate-200 uppercase tracking-wider rounded transition-colors group cursor-pointer select-none"
              >
                <span>Operaciones</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-transform duration-200 ${
                    collapsedCategories.operaciones ? "-rotate-90" : "rotate-0"
                  }`}
                />
              </button>
            ) : (
              <div className="h-px bg-white/5 my-1 mx-1" />
            )}

            {(!collapsedCategories.operaciones || isCollapsed) && (
              <div className="space-y-0.5 mt-0.5">
                <button
                  type="button"
                  onClick={() => onSelectSection("turnos")}
                  className={navItemClass("turnos")}
                  title="Gestión de turnos"
                >
                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                  {!isCollapsed && <span>Gestión de turnos</span>}
                </button>

                {modules.sales && (
                  <button
                    type="button"
                    onClick={() => onSelectSection("ventas")}
                    className={navItemClass("ventas")}
                    title="Gestión de ventas"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 flex-shrink-0" />
                    {!isCollapsed && <span>Gestión de ventas</span>}
                  </button>
                )}

                {isAdmin && modules.staffManagement && (
                  <button
                    type="button"
                    onClick={() => onSelectSection("barberos")}
                    className={navItemClass("barberos")}
                    title="Gestión de barberos"
                  >
                    <Users className="w-3.5 h-3.5 flex-shrink-0" />
                    {!isCollapsed && <span>Gestión de barberos</span>}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Módulo 4: Facturación ARCA (Solo Admin & Si ARCA está activo) */}
          {arcaEnabled && isAdmin && (
            <div>
              {!isCollapsed ? (
                <button
                  type="button"
                  onClick={() => toggleCategory("facturacion")}
                  className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-bold text-slate-400 hover:text-slate-200 uppercase tracking-wider rounded transition-colors group cursor-pointer select-none"
                >
                  <span>Facturación ARCA</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-transform duration-200 ${
                      collapsedCategories.facturacion ? "-rotate-90" : "rotate-0"
                    }`}
                  />
                </button>
              ) : (
                <div className="h-px bg-white/5 my-1 mx-1" />
              )}

              {(!collapsedCategories.facturacion || isCollapsed) && (
                <div className="space-y-0.5 mt-0.5">
                  <button
                    type="button"
                    onClick={() => onSelectSection("facturas")}
                    className={navItemClass("facturas")}
                    title="Comprobantes"
                  >
                    <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                    {!isCollapsed && <span>Comprobantes</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectSection("facturacion-config")}
                    className={navItemClass("facturacion-config")}
                    title="Configuración ARCA"
                  >
                    <Settings className="w-3.5 h-3.5 flex-shrink-0" />
                    {!isCollapsed && <span>Configuración ARCA</span>}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Módulo 5: Configuración del Local (Solo Admin) */}
          {isAdmin && (
            <div>
              {!isCollapsed ? (
                <button
                  type="button"
                  onClick={() => toggleCategory("configuracion")}
                  className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-bold text-slate-400 hover:text-slate-200 uppercase tracking-wider rounded transition-colors group cursor-pointer select-none"
                >
                  <span>Configuración</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-transform duration-200 ${
                      collapsedCategories.configuracion ? "-rotate-90" : "rotate-0"
                    }`}
                  />
                </button>
              ) : (
                <div className="h-px bg-white/5 my-1 mx-1" />
              )}

              {(!collapsedCategories.configuracion || isCollapsed) && (
                <div className="space-y-0.5 mt-0.5">
                  <button
                    type="button"
                    onClick={() => onSelectSection("config-identidad")}
                    className={navItemClass("config-identidad")}
                    title="Identidad y marca"
                  >
                    <Store className="w-3.5 h-3.5 flex-shrink-0" />
                    {!isCollapsed && <span>Identidad y marca</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectSection("config-horarios")}
                    className={navItemClass("config-horarios")}
                    title="Horarios y atención"
                  >
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                    {!isCollapsed && <span>Horarios y atención</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectSection("config-contacto")}
                    className={navItemClass("config-contacto")}
                    title="Contacto y canales"
                  >
                    <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {!isCollapsed && <span>Contacto y canales</span>}
                  </button>

                  {modules.paymentMethods && (
                    <button
                      type="button"
                      onClick={() => onSelectSection("config-pagos")}
                      className={navItemClass("config-pagos")}
                      title="Medios de pago"
                    >
                      <CreditCard className="w-3.5 h-3.5 flex-shrink-0" />
                      {!isCollapsed && <span>Medios de pago</span>}
                    </button>
                  )}

                  {googleReviewsEnabled && (
                    <button
                      type="button"
                      onClick={() => onSelectSection("config-resenas")}
                      className={navItemClass("config-resenas")}
                      title="Reseñas de Google"
                    >
                      <Star className="w-3.5 h-3.5 flex-shrink-0" />
                      {!isCollapsed && <span>Reseñas de Google</span>}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer fijo al fondo de la pantalla del navegador */}
        <div className={`flex-shrink-0 pt-2.5 pb-0.5 mt-auto border-t border-white/10 ${isCollapsed ? "px-1 flex flex-col items-center justify-center gap-1.5" : "px-2 flex items-center justify-between"}`}>
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 min-w-0">
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent)] flex-shrink-0" />
                <span className="truncate text-[11px]">{PRODUCT_NAME}</span>
              </div>
              <span className="text-[10px] font-mono font-medium text-slate-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/10 flex-shrink-0" title={`Versión de ${PRODUCT_NAME}`}>
                v{APP_VERSION}
              </span>
            </>
          ) : (
            <span className="text-[9px] font-mono font-bold text-slate-400 bg-white/5 px-1 py-0.5 rounded border border-white/10 text-center" title={`Versión ${APP_VERSION}`}>
              v{APP_VERSION}
            </span>
          )}
        </div>
      </div>
    </>
  );
}
