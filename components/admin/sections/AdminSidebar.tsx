"use client";

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
} from "lucide-react";
import { APP_VERSION } from "@/lib/version";

export type AdminSection =
  | "metricas"
  | "finanzas"
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

interface Props {
  activeSection: AdminSection;
  onSelectSection: (section: AdminSection) => void;
  isAdmin: boolean;
  arcaEnabled: boolean;
}

export default function AdminSidebar({
  activeSection,
  onSelectSection,
  isAdmin,
  arcaEnabled,
}: Readonly<Props>) {
  const navItemClass = (section: AdminSection) => {
    const isActive =
      activeSection === section ||
      (section === "facturas" && activeSection === "facturacion") ||
      (section === "facturacion" && activeSection === "facturas");
    return `w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all text-left cursor-pointer ${
      isActive
        ? "!bg-[var(--accent)]/15 !text-[var(--accent)] !border !border-[var(--accent)]/30 font-semibold shadow-sm"
        : "!bg-transparent !text-slate-400 hover:!text-white hover:!bg-white/5 !border !border-transparent"
    }`;
  };

  return (
    <>
      {/* VERSIÓN MOBILE: Barra de pestañas horizontal deslizable */}
      <div className="lg:hidden w-full overflow-x-auto py-3 px-4 border-b border-white/10 bg-[#0B132B]/60 backdrop-blur-md sticky top-[64px] z-30 flex items-center gap-2 no-scrollbar">
        <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-1 rounded border border-white/10 flex-shrink-0">
          v{APP_VERSION}
        </span>
        <button
          type="button"
          onClick={() => onSelectSection("metricas")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium transition-all ${
            activeSection === "metricas"
              ? "!bg-[var(--accent)] !text-slate-950 font-bold"
              : "!bg-white/5 !text-slate-300"
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Métricas</span>
        </button>

        {isAdmin && (
          <button
            type="button"
            onClick={() => onSelectSection("finanzas")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium transition-all ${
              activeSection === "finanzas"
                ? "!bg-[var(--accent)] !text-slate-950 font-bold"
                : "!bg-white/5 !text-slate-300"
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Finanzas</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onSelectSection("turnos")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium transition-all ${
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
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium transition-all ${
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium transition-all ${
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium transition-all ${
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium transition-all ${
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium transition-all ${
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium transition-all ${
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium transition-all ${
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium transition-all ${
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

      {/* VERSIÓN DESKTOP: Columna lateral fija estilo Supabase */}
      <aside className="hidden lg:flex flex-col w-full h-full py-6 px-4">
        {/* Cabecera del Sidebar estilo Supabase */}
        <div className="px-3 pb-5 mb-3 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>Administración</span>
            </h2>
            <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-md bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/20">
              {isAdmin ? "Admin" : "Barbero"}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {isAdmin ? "Configuración y control global" : "Tus turnos y balance"}
          </p>
        </div>

        {/* Lista de navegación categorizada estilo Supabase */}
        <div className="flex-1 space-y-6 overflow-y-auto pr-1">
          {/* Categoría: Resumen y Finanzas */}
          <div>
            <div className="text-[10px] font-bold text-slate-400 tracking-wider px-3 mb-2">
              Resumen y finanzas
            </div>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => onSelectSection("metricas")}
                className={navItemClass("metricas")}
              >
                <TrendingUp className="w-4 h-4 flex-shrink-0" />
                <span>Métricas</span>
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => onSelectSection("finanzas")}
                  className={navItemClass("finanzas")}
                >
                  <Wallet className="w-4 h-4 flex-shrink-0" />
                  <span>Finanzas</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onSelectSection("ventas")}
                className={navItemClass("ventas")}
              >
                <ShoppingBag className="w-4 h-4 flex-shrink-0" />
                <span>Ventas</span>
              </button>
            </div>
          </div>

          {/* Categoría: Facturación (Solo Admin & Si ARCA está activo) */}
          {arcaEnabled && isAdmin && (
            <div>
              <div className="text-[10px] font-bold text-slate-400 tracking-wider px-3 mb-2">
                Facturación
              </div>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => onSelectSection("facturas")}
                  className={navItemClass("facturas")}
                >
                  <FileText className="w-4 h-4 flex-shrink-0" />
                  <span>Comprobantes</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectSection("facturacion-config")}
                  className={navItemClass("facturacion-config")}
                >
                  <Settings className="w-4 h-4 flex-shrink-0" />
                  <span>Configuración ARCA</span>
                </button>
              </div>
            </div>
          )}

          {/* Categoría: Operaciones */}
          <div>
            <div className="text-[10px] font-bold text-slate-400 tracking-wider px-3 mb-2">
              Operaciones
            </div>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => onSelectSection("turnos")}
                className={navItemClass("turnos")}
              >
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span>Gestión de turnos</span>
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => onSelectSection("barberos")}
                  className={navItemClass("barberos")}
                >
                  <Users className="w-4 h-4 flex-shrink-0" />
                  <span>Gestión de barberos</span>
                </button>
              )}
            </div>
          </div>

          {/* Categoría: Configuración del Local (Solo Admin) */}
          {isAdmin && (
            <div>
              <div className="text-[10px] font-bold text-slate-400 tracking-wider px-3 mb-2">
                Configuración del local
              </div>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => onSelectSection("config-identidad")}
                  className={navItemClass("config-identidad")}
                >
                  <Store className="w-4 h-4 flex-shrink-0" />
                  <span>Identidad y marca</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectSection("config-horarios")}
                  className={navItemClass("config-horarios")}
                >
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span>Horarios y atención</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectSection("config-contacto")}
                  className={navItemClass("config-contacto")}
                >
                  <MessageCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Contacto y canales</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectSection("config-pagos")}
                  className={navItemClass("config-pagos")}
                >
                  <CreditCard className="w-4 h-4 flex-shrink-0" />
                  <span>Medios de pago</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer en la parte inferior del sidebar de /admin */}
        <div className="pt-4 mt-auto border-t border-white/10 px-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="truncate">Gestor de Turnos</span>
          </div>
          <span className="text-[11px] font-mono font-medium text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10" title="Versión del gestor">
            v{APP_VERSION}
          </span>
        </div>
      </aside>
    </>
  );
}
