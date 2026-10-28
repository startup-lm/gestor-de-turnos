"use client";

import { useState } from "react";
import {
  TrendingUp,
  Wallet,
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
} from "lucide-react";
import { APP_VERSION } from "@/lib/version";

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
  | "config-pagos";

type ModuleCategory =
  | "principal"
  | "finanzas"
  | "operaciones"
  | "facturacion"
  | "configuracion";

interface Props {
  activeSection: AdminSection;
  onSelectSection: (section: AdminSection) => void;
  isAdmin: boolean;
  arcaEnabled: boolean;
  cashManagementEnabled?: boolean;
}

export default function AdminSidebar({
  activeSection,
  onSelectSection,
  isAdmin,
  arcaEnabled,
  cashManagementEnabled = false,
}: Readonly<Props>) {
  // Estado para colapsar/desplegar categorías. Por defecto: TODOS VISIBLES (false = no colapsado)
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
    return `w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
      isActive
        ? "!bg-[var(--accent)]/15 !text-[var(--accent)] !border !border-[var(--accent)]/30 font-semibold shadow-sm"
        : "!bg-transparent !text-slate-400 hover:!text-white hover:!bg-white/5 !border !border-transparent"
    }`;
  };

  return (
    <>
      {/* VERSIÓN MOBILE: Barra de pestañas horizontal deslizable */}
      <div className="lg:hidden w-full overflow-x-auto py-2.5 px-3 border-b border-white/10 bg-[#0B132B]/60 backdrop-blur-md sticky top-[64px] z-30 flex items-center gap-1.5 no-scrollbar">
        <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-1 rounded border border-white/10 flex-shrink-0">
          v{APP_VERSION}
        </span>

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
          <span>Panel</span>
        </button>

        {isAdmin && !cashManagementEnabled && (
          <button
            type="button"
            onClick={() => onSelectSection("finanzas")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium transition-all ${
              activeSection === "finanzas"
                ? "!bg-[var(--accent)] !text-slate-950 font-bold"
                : "!bg-white/5 !text-slate-300"
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Finanzas</span>
          </button>
        )}

        {isAdmin && cashManagementEnabled && (
          <>
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
              <span>Balance</span>
            </button>
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
              <span>Pagos</span>
            </button>
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
              <span>Gastos</span>
            </button>
          </>
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
          <span>Turnos</span>
        </button>

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
          <span>Ventas</span>
        </button>

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
              <span>Config. ARCA</span>
            </button>
          </>
        )}

        {isAdmin && (
          <>
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
              <span>Barberos</span>
            </button>

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
              <span>Identidad</span>
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
              <span>Horarios</span>
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
              <span>Contacto</span>
            </button>

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
              <span>Pagos</span>
            </button>
          </>
        )}
      </div>

      {/* VERSIÓN DESKTOP: Menú lateral compacto y colapsable */}
      <aside className="hidden lg:flex flex-col w-full h-full py-4 px-3">
        {/* Cabecera del Sidebar */}
        <div className="px-2 pb-3 mb-2 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>Administración</span>
            </h2>
            <span className="text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/20">
              {isAdmin ? "Admin" : "Barbero"}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {isAdmin ? "Configuración y control global" : "Tus turnos y balance"}
          </p>
        </div>

        {/* Lista de navegación categorizada y colapsable */}
        <div className="flex-1 space-y-3 overflow-y-auto pr-0.5">
          {/* Módulo 1: Panel Principal */}
          <div>
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

            {!collapsedCategories.principal && (
              <div className="space-y-0.5 mt-0.5">
                <button
                  type="button"
                  onClick={() => onSelectSection("metricas")}
                  className={navItemClass("metricas")}
                >
                  <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Panel de control</span>
                </button>
              </div>
            )}
          </div>

          {/* Módulo 2: Finanzas y Caja (Solo Admin) */}
          {isAdmin && (
            <div>
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

              {!collapsedCategories.finanzas && (
                <div className="space-y-0.5 mt-0.5">
                  {cashManagementEnabled ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onSelectSection("finanzas")}
                        className={navItemClass("finanzas")}
                      >
                        <Coins className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Balance y liquidaciones</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectSection("finanzas-liquidaciones")}
                        className={navItemClass("finanzas-liquidaciones")}
                      >
                        <Receipt className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Historial de pagos</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectSection("finanzas-gastos")}
                        className={navItemClass("finanzas-gastos")}
                      >
                        <TrendingDown className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Gastos del salón</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectSection("finanzas")}
                      className={navItemClass("finanzas")}
                    >
                      <Wallet className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Finanzas</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Módulo 3: Operaciones */}
          <div>
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

            {!collapsedCategories.operaciones && (
              <div className="space-y-0.5 mt-0.5">
                <button
                  type="button"
                  onClick={() => onSelectSection("turnos")}
                  className={navItemClass("turnos")}
                >
                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Gestión de turnos</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectSection("ventas")}
                  className={navItemClass("ventas")}
                >
                  <ShoppingBag className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Gestión de ventas</span>
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => onSelectSection("barberos")}
                    className={navItemClass("barberos")}
                  >
                    <Users className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Gestión de barberos</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Módulo 4: Facturación ARCA (Solo Admin & Si ARCA está activo) */}
          {arcaEnabled && isAdmin && (
            <div>
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

              {!collapsedCategories.facturacion && (
                <div className="space-y-0.5 mt-0.5">
                  <button
                    type="button"
                    onClick={() => onSelectSection("facturas")}
                    className={navItemClass("facturas")}
                  >
                    <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Comprobantes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectSection("facturacion-config")}
                    className={navItemClass("facturacion-config")}
                  >
                    <Settings className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Configuración ARCA</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Módulo 5: Configuración del Local (Solo Admin) */}
          {isAdmin && (
            <div>
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

              {!collapsedCategories.configuracion && (
                <div className="space-y-0.5 mt-0.5">
                  <button
                    type="button"
                    onClick={() => onSelectSection("config-identidad")}
                    className={navItemClass("config-identidad")}
                  >
                    <Store className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Identidad y marca</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectSection("config-horarios")}
                    className={navItemClass("config-horarios")}
                  >
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Horarios y atención</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectSection("config-contacto")}
                    className={navItemClass("config-contacto")}
                  >
                    <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Contacto y canales</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectSection("config-pagos")}
                    className={navItemClass("config-pagos")}
                  >
                    <CreditCard className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Medios de pago</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer en la parte inferior del sidebar de /admin */}
        <div className="pt-3 mt-auto border-t border-white/10 px-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="truncate text-[11px]">Gestor de Turnos</span>
          </div>
          <span className="text-[10px] font-mono font-medium text-slate-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/10" title="Versión del gestor">
            v{APP_VERSION}
          </span>
        </div>
      </aside>
    </>
  );
}
