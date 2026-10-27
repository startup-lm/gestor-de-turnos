import React from "react";

export default function Skeleton({
  className = "",
  style,
}: Readonly<{ className?: string; style?: React.CSSProperties }>) {
  return (
    <div
      className={`animate-pulse bg-slate-700/40 rounded-lg ${className}`}
      style={style}
    />
  );
}

/**
 * Skeleton para la Agenda de Turnos (7 columnas de días + franjas horarias)
 */
export function CalendarSkeleton() {
  return (
    <div className="w-full flex flex-col gap-5 p-6 border border-[var(--foreground)]/5 rounded-2xl bg-[var(--bg-carousel)] shadow-xl">
      {/* Cabecera del Calendario */}
      <div className="flex justify-between items-center mb-2 animate-pulse">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>

      {/* Grilla Semanal de la Agenda */}
      <div className="grid grid-cols-7 gap-3 animate-pulse">
        {Array.from({ length: 7 }).map((_, colIdx) => (
          <div key={colIdx} className="space-y-3 flex flex-col items-center">
            {/* Header del día */}
            <Skeleton className="h-5 w-12 mb-1" />

            {/* Franjas horarias */}
            {Array.from({ length: 6 }).map((_, slotIdx) => (
              <Skeleton
                key={slotIdx}
                className="h-10 w-full bg-slate-800/30 border border-slate-800/10 rounded-xl"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton de sección general para solapas del Admin
 */
export function SectionSkeleton() {
  return (
    <div className="w-full space-y-6 animate-pulse p-4">
      <Skeleton className="h-8 w-48 mb-6 bg-slate-800/40" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-28 rounded-2xl bg-slate-800/40" />
        <Skeleton className="h-28 rounded-2xl bg-slate-800/40" />
        <Skeleton className="h-28 rounded-2xl bg-slate-800/40" />
      </div>
      <Skeleton className="h-72 rounded-2xl mt-6 bg-slate-800/30" />
    </div>
  );
}

/**
 * Skeleton de Alta Fidelidad para Tabla de Turnos (9 columnas reales exactas)
 */
export function AppointmentsTableSkeleton() {
  return (
    <div className="w-full space-y-4 animate-pulse">
      {/* Barra de Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/40 p-4 rounded-2xl border border-white/5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-52 sm:w-64 rounded-xl bg-slate-800/50" />
          <Skeleton className="h-9 w-36 rounded-xl bg-slate-800/50" />
        </div>
        <Skeleton className="h-9 w-28 rounded-xl bg-slate-800/50" />
      </div>

      {/* Tabla de 9 Columnas */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/30 shadow-xl">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/10 text-[10px] tracking-wider text-slate-400">
              <th className="py-3 px-3 w-14"># ID</th>
              <th className="py-3 px-3">Cliente</th>
              <th className="py-3 px-3">Teléfono</th>
              <th className="py-3 px-3">Barbero</th>
              <th className="py-3 px-3">Servicio</th>
              <th className="py-3 px-3">Fecha y Hora</th>
              <th className="py-3 px-3 text-right">Precio</th>
              <th className="py-3 px-3 text-center">Estado Pago</th>
              <th className="py-3 px-3 text-center w-24">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {Array.from({ length: 6 }).map((_, idx) => (
              <tr key={idx} className="hover:bg-white/[0.02]">
                <td className="py-3.5 px-3">
                  <Skeleton className="h-4 w-8 rounded bg-slate-800/50" />
                </td>
                <td className="py-3.5 px-3">
                  <Skeleton className="h-4 w-28 rounded bg-slate-800/50" />
                </td>
                <td className="py-3.5 px-3">
                  <Skeleton className="h-4 w-24 rounded bg-slate-800/50" />
                </td>
                <td className="py-3.5 px-3">
                  <Skeleton className="h-4 w-24 rounded bg-slate-800/50" />
                </td>
                <td className="py-3.5 px-3">
                  <Skeleton className="h-4 w-24 rounded bg-slate-800/50" />
                </td>
                <td className="py-3.5 px-3">
                  <Skeleton className="h-4 w-28 rounded bg-slate-800/50" />
                </td>
                <td className="py-3.5 px-3 text-right">
                  <Skeleton className="h-4 w-16 ml-auto rounded bg-slate-800/50" />
                </td>
                <td className="py-3.5 px-3 text-center">
                  <Skeleton className="h-6 w-20 mx-auto rounded-full bg-slate-800/50" />
                </td>
                <td className="py-3.5 px-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Skeleton className="h-7 w-7 rounded-lg bg-slate-800/50" />
                    <Skeleton className="h-7 w-7 rounded-lg bg-slate-800/50" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Skeleton de Alta Fidelidad para Tabla de Ventas (8 columnas reales exactas)
 */
export function SalesTableSkeleton() {
  return (
    <div className="w-full space-y-4 animate-pulse">
      {/* Barra Informativa */}
      <div className="flex items-center justify-between bg-slate-900/40 p-3.5 rounded-2xl border border-white/5">
        <Skeleton className="h-5 w-44 rounded bg-slate-800/50" />
        <Skeleton className="h-5 w-32 rounded bg-slate-800/50" />
      </div>

      {/* Tabla de 8 Columnas */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/30 shadow-xl">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/10 text-[10px] tracking-wider text-slate-400">
              <th className="py-3 px-3 w-28">Fecha</th>
              <th className="py-3 px-3 w-14"># ID</th>
              <th className="py-3 px-3">Productos</th>
              <th className="py-3 px-3">Barbero</th>
              <th className="py-3 px-3 text-right">Monto</th>
              <th className="py-3 px-3 text-center">Método</th>
              <th className="py-3 px-3 text-center">Factura</th>
              <th className="py-3 px-3 text-center w-24">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {Array.from({ length: 5 }).map((_, idx) => (
              <tr key={idx} className="hover:bg-white/[0.02]">
                <td className="py-3.5 px-3">
                  <Skeleton className="h-4 w-20 rounded bg-slate-800/50" />
                </td>
                <td className="py-3.5 px-3">
                  <Skeleton className="h-4 w-8 rounded bg-slate-800/50" />
                </td>
                <td className="py-3.5 px-3">
                  <Skeleton className="h-4 w-36 rounded bg-slate-800/50" />
                </td>
                <td className="py-3.5 px-3">
                  <Skeleton className="h-4 w-24 rounded bg-slate-800/50" />
                </td>
                <td className="py-3.5 px-3 text-right">
                  <Skeleton className="h-4 w-16 ml-auto rounded bg-slate-800/50" />
                </td>
                <td className="py-3.5 px-3 text-center">
                  <Skeleton className="h-6 w-20 mx-auto rounded-full bg-slate-800/50" />
                </td>
                <td className="py-3.5 px-3 text-center">
                  <Skeleton className="h-6 w-16 mx-auto rounded-full bg-slate-800/50" />
                </td>
                <td className="py-3.5 px-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Skeleton className="h-7 w-7 rounded-lg bg-slate-800/50" />
                    <Skeleton className="h-7 w-7 rounded-lg bg-slate-800/50" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Skeleton para Gráfico Principal de Barras o Líneas (Dashboard / Métricas)
 */
export function ChartSkeleton() {
  return (
    <div className="w-full h-80 rounded-2xl border border-white/10 bg-slate-900/40 p-6 flex flex-col justify-between animate-pulse">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <Skeleton className="h-5 w-40 rounded bg-slate-800/60" />
        <Skeleton className="h-7 w-28 rounded-lg bg-slate-800/60" />
      </div>
      <div className="flex items-end justify-between gap-3 h-44 px-2 pt-4">
        {[40, 65, 30, 85, 55, 75, 45, 90, 60].map((height, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center gap-2">
            <Skeleton
              className="w-full rounded-t-lg bg-slate-800/50"
              style={{ height: `${height}%` }}
            />
            <Skeleton className="h-3 w-6 rounded bg-slate-800/30" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton para Gráfico Donut / Circular (Dashboard / Métricas)
 */
export function PieChartSkeleton() {
  return (
    <div className="w-full h-80 rounded-2xl border border-white/10 bg-slate-900/40 p-6 flex flex-col justify-between animate-pulse">
      <div className="border-b border-white/5 pb-3">
        <Skeleton className="h-5 w-36 rounded bg-slate-800/60" />
      </div>
      <div className="flex items-center justify-around gap-6 my-auto">
        <div className="relative w-36 h-36 rounded-full border-8 border-slate-800/50 flex items-center justify-center">
          <Skeleton className="w-16 h-16 rounded-full bg-slate-900/60" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="w-3 h-3 rounded-full bg-slate-800/60" />
              <Skeleton className="h-3.5 w-24 rounded bg-slate-800/50" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton completo de Dashboard (3 KPIs + Gráfico de Barras + Gráfico Donut)
 */
export function DashboardSkeleton() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* 3 Tarjetas de Métricas KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl border border-white/10 bg-slate-900/40 flex items-center justify-between"
          >
            <div className="space-y-2">
              <Skeleton className="h-3 w-28 rounded bg-slate-800/50" />
              <Skeleton className="h-8 w-24 rounded bg-slate-800/70" />
              <Skeleton className="h-2.5 w-36 rounded bg-slate-800/40" />
            </div>
            <Skeleton className="w-12 h-12 rounded-xl bg-slate-800/40" />
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartSkeleton />
        </div>
        <div>
          <PieChartSkeleton />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton de Gráficos Financieros (FinanzasSection)
 */
export function FinancialChartsSkeleton() {
  return (
    <div className="w-full h-72 rounded-2xl border border-white/10 bg-slate-900/40 p-6 flex flex-col justify-between animate-pulse">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <Skeleton className="h-5 w-44 rounded bg-slate-800/60" />
        <Skeleton className="h-6 w-32 rounded-lg bg-slate-800/50" />
      </div>
      <div className="flex items-end justify-between gap-4 h-40 px-4 pt-2">
        {[50, 70, 45, 80, 60, 90].map((h, i) => (
          <div key={i} className="flex-1 flex gap-1.5 items-end h-full">
            <Skeleton className="flex-1 rounded-t bg-slate-800/60" style={{ height: `${h}%` }} />
            <Skeleton className="flex-1 rounded-t bg-slate-700/40" style={{ height: `${h * 0.7}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton de Formularios de Edición y Detalle (Turnos, Ventas, Split Panels)
 */
export function DetailFormSkeleton() {
  return (
    <div className="w-full max-w-[1720px] mx-auto space-y-6 animate-pulse py-4">
      {/* Cabecera con botón volver y acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-5">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28 rounded bg-slate-800/50" />
          <Skeleton className="h-8 w-48 rounded bg-slate-800/70" />
          <Skeleton className="h-3 w-56 rounded bg-slate-800/40" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-28 rounded-xl bg-slate-800/50" />
          <Skeleton className="h-9 w-28 rounded-xl bg-slate-800/50" />
        </div>
      </div>

      {/* Grilla de 2 Columnas de Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl border border-white/10 bg-slate-900/40 space-y-5">
          <Skeleton className="h-5 w-36 rounded bg-slate-800/60 mb-2" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-20 rounded bg-slate-800/40" />
              <Skeleton className="h-10 w-full rounded-xl bg-slate-800/50" />
            </div>
          ))}
        </div>

        <div className="p-6 rounded-3xl border border-white/10 bg-slate-900/40 space-y-5">
          <Skeleton className="h-5 w-36 rounded bg-slate-800/60 mb-2" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-20 rounded bg-slate-800/40" />
              <Skeleton className="h-10 w-full rounded-xl bg-slate-800/50" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton para Secciones de Configuración en Admin
 */
export function ConfigFormSkeleton() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48 rounded bg-slate-800/70" />
          <Skeleton className="h-3.5 w-64 rounded bg-slate-800/40" />
        </div>
        <Skeleton className="h-9 w-32 rounded-xl bg-slate-800/60" />
      </div>

      {/* Bloques de Configuración */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-6 rounded-2xl border border-white/10 bg-slate-900/40 space-y-4">
            <Skeleton className="h-4 w-40 rounded bg-slate-800/60" />
            <Skeleton className="h-10 w-full rounded-xl bg-slate-800/50" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton para Facturación Fiscal (ArcaPage)
 */
export function ArcaSkeleton() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* Selector de Período */}
      <div className="p-4 rounded-2xl border border-white/10 bg-slate-900/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <Skeleton className="h-5 w-44 rounded bg-slate-800/60" />
        <Skeleton className="h-8 w-60 rounded-xl bg-slate-800/50" />
      </div>

      {/* 3 Tarjetas de Métricas Fiscales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-5 rounded-2xl border border-white/10 bg-slate-900/40 space-y-2">
            <Skeleton className="h-3.5 w-28 rounded bg-slate-800/50" />
            <Skeleton className="h-7 w-32 rounded bg-slate-800/70" />
          </div>
        ))}
      </div>

      {/* Tabla de Facturas */}
      <SalesTableSkeleton />
    </div>
  );
}

/**
 * Skeleton para Pantalla de Login / Recuperar Contraseña
 */
export function LoginCardSkeleton() {
  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-4 animate-pulse">
      <div className="w-full max-w-md p-8 rounded-3xl border border-white/10 bg-slate-900/50 shadow-2xl space-y-6">
        <div className="flex flex-col items-center space-y-3">
          <Skeleton className="w-20 h-20 rounded-full bg-slate-800/60" />
          <Skeleton className="h-6 w-40 rounded bg-slate-800/70" />
          <Skeleton className="h-3.5 w-56 rounded bg-slate-800/40" />
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-16 rounded bg-slate-800/40" />
            <Skeleton className="h-11 w-full rounded-xl bg-slate-800/50" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-20 rounded bg-slate-800/40" />
            <Skeleton className="h-11 w-full rounded-xl bg-slate-800/50" />
          </div>
          <Skeleton className="h-11 w-full rounded-xl bg-slate-800/70 mt-2" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton para Pantalla Principal y Carga General (app/loading.tsx)
 */
export function PageSkeleton() {
  return (
    <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 md:px-8 space-y-8 sm:space-y-12 pt-4 sm:pt-6 animate-pulse">
      {/* Banner Hero */}
      <div className="relative min-h-[440px] sm:min-h-[480px] rounded-3xl border border-white/5 bg-slate-900/40 flex flex-col items-center justify-center p-8 text-center space-y-5">
        <Skeleton className="h-6 w-32 rounded-full bg-slate-800/60" />
        <Skeleton className="h-12 w-64 sm:w-96 rounded-2xl bg-slate-800/70" />
        <Skeleton className="h-4 w-72 sm:w-80 rounded bg-slate-800/40" />
        <div className="flex items-center gap-3 pt-3">
          <Skeleton className="h-11 w-36 rounded-xl bg-slate-800/60" />
          <Skeleton className="h-11 w-36 rounded-xl bg-slate-800/40" />
        </div>
      </div>

      {/* Carruseles Duales (Servicios y Productos) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <div className="h-72 rounded-3xl border border-white/5 bg-slate-900/30 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-36 rounded bg-slate-800/60" />
            <Skeleton className="h-4 w-20 rounded bg-slate-800/40" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-40 rounded-2xl bg-slate-800/40" />
            <Skeleton className="h-40 rounded-2xl bg-slate-800/40" />
          </div>
        </div>

        <div className="h-72 rounded-3xl border border-white/5 bg-slate-900/30 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-36 rounded bg-slate-800/60" />
            <Skeleton className="h-4 w-20 rounded bg-slate-800/40" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-40 rounded-2xl bg-slate-800/40" />
            <Skeleton className="h-40 rounded-2xl bg-slate-800/40" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton para la Grilla de Barberos (AdminBarberosClient)
 */
export function BarbersGridSkeleton() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48 rounded bg-slate-800/70" />
          <Skeleton className="h-3.5 w-64 rounded bg-slate-800/40" />
        </div>
        <Skeleton className="h-9 w-36 rounded-xl bg-slate-800/60" />
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 justify-items-center sm:justify-items-start">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-[300px] sm:w-[320px] min-h-[350px] border border-white/10 rounded-2xl p-5 flex flex-col items-center justify-between bg-slate-900/40"
          >
            <div className="w-full flex justify-between mb-2">
              <Skeleton className="h-8 w-8 rounded-lg bg-slate-800/50" />
              <Skeleton className="h-8 w-8 rounded-lg bg-slate-800/50" />
            </div>
            <Skeleton className="w-24 h-24 rounded-full bg-slate-800/60 my-2" />
            <Skeleton className="h-5 w-32 rounded bg-slate-800/70 mb-1" />
            <Skeleton className="h-3.5 w-40 rounded bg-slate-800/40 mb-3" />
            <div className="w-full space-y-2 border-t border-white/5 pt-3">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-16 rounded bg-slate-800/40" />
                <Skeleton className="h-3 w-12 rounded bg-slate-800/40" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-3 w-20 rounded bg-slate-800/40" />
                <Skeleton className="h-3 w-12 rounded bg-slate-800/40" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
