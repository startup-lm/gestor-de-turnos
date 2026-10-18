"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Spinner from "@/components/loading/Spinner";
import PopupModal from "@/components/ui/PopupModal";
import SaveButton from "@/components/buttons/SaveButton";
import SendButton from "@/components/buttons/SendButton";
import { usePopup } from "@/lib/hooks/usePopup";
import { useFetchOnce } from "@/lib/hooks/useFetchOnce";
import {
  emitArcaInvoice,
  getArcaConfig,
  getArcaInvoices,
  getArcaStatus,
  updateArcaConfig,
} from "@/lib/repository/arca";
import type {
  ArcaConfig,
  ArcaDocType,
  ArcaEnvironment,
  ArcaInvoiceRecord,
  ArcaStatus,
} from "@/lib/types/Arca";
import {
  FileText,
  CheckCircle,
  XCircle,
  Receipt,
  ChevronDown,
  ChevronUp,
  Download,
  Filter,
} from "lucide-react";

// ─── Constantes ────────────────────────────────────────────────────────────

const ENV_LABELS: Record<ArcaEnvironment, string> = {
  mock: "Demo",
  homo: "Homologación",
  prod: "Producción",
};

const SOURCE_LABELS: Record<string, string> = {
  appointment: "Turno",
  sale: "Venta",
  manual: "Manual",
};

const DOC_TYPE_LABELS: Record<number, string> = {
  80: "CUIT",
  86: "CUIL",
  96: "DNI",
  99: "Cons. Final",
};

const DOC_TYPES: { value: ArcaDocType; label: string }[] = [
  { value: 99, label: "Consumidor Final" },
  { value: 96, label: "DNI" },
  { value: 80, label: "CUIT" },
  { value: 86, label: "CUIL" },
];

// ─── Helpers ───────────────────────────────────────────────────────────────

function exportToCsv(invoices: ArcaInvoiceRecord[]) {
  const headers = [
    "Fecha",
    "Estado",
    "Total",
    "Cliente",
    "CAE",
    "Vto. CAE",
    "Nro.",
    "PV",
    "Origen",
    "Doc. Tipo",
    "Doc. Nro.",
  ];
  const rows = invoices.map((inv) => [
    inv.created_at ? new Date(inv.created_at).toLocaleDateString("es-AR") : "-",
    inv.status,
    inv.total.toFixed(2),
    inv.customer_name ?? "Cons. Final",
    inv.cae ?? "-",
    inv.cae_due_date ?? "-",
    inv.voucher_number ?? "-",
    inv.point_of_sale ?? "-",
    inv.source_type ? SOURCE_LABELS[inv.source_type] ?? inv.source_type : "Manual",
    inv.doc_type ? DOC_TYPE_LABELS[inv.doc_type] ?? String(inv.doc_type) : "-",
    inv.doc_number ?? "-",
  ]);

  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `comprobantes_arca_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Sub-componentes ───────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  color = "accent",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: "accent" | "green" | "yellow" | "red";
}) {
  const colorMap = {
    accent: "text-[var(--accent)] bg-[var(--accent)]/10 border-[var(--accent)]/20",
    green: "text-green-400 bg-green-500/10 border-green-500/20",
    yellow: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    red: "text-red-400 bg-red-500/10 border-red-500/20",
  };
  return (
    <div className={`rounded-xl border p-4 flex items-center gap-3 ${colorMap[color]}`}>
      <div className="p-2 rounded-lg bg-current/10">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-medium opacity-70 uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold">{value}</p>
        {sub && <p className="text-[10px] opacity-60 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function InvoiceRow({ inv }: { inv: ArcaInvoiceRecord }) {
  const [expanded, setExpanded] = useState(false);

  const statusColor =
    inv.status === "mock"
      ? "bg-yellow-500/10 text-yellow-300 border-yellow-500/20"
      : inv.status === "approved"
      ? "bg-green-500/10 text-green-300 border-green-500/20"
      : "bg-red-500/10 text-red-300 border-red-500/20";

  const statusLabel =
    inv.status === "mock" ? "Demo" : inv.status === "approved" ? "Aprobado" : "Rechazado";

  return (
    <>
      <tr
        className="border-b border-gray-800 hover:bg-white/2 cursor-pointer transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="py-2.5 pr-3 whitespace-nowrap text-xs">
          {inv.created_at ? new Date(inv.created_at).toLocaleDateString("es-AR") : "-"}
        </td>
        <td className="py-2.5 pr-3">
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${statusColor}`}>
            {statusLabel}
          </span>
        </td>
        <td className="py-2.5 pr-3 font-semibold text-[var(--accent)] whitespace-nowrap text-sm">
          ${Number(inv.total).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
        </td>
        <td className="py-2.5 pr-3 text-xs text-[var(--foreground)]/70 max-w-[120px] truncate">
          {inv.customer_name ?? "Cons. Final"}
        </td>
        <td className="py-2.5 pr-3 text-xs font-mono">
          {inv.cae ? (
            <span className="text-green-400">{inv.cae}</span>
          ) : (
            <span className="text-[var(--foreground)]/30">—</span>
          )}
        </td>
        <td className="py-2.5 pr-3 text-xs text-[var(--foreground)]/60">
          {inv.voucher_number != null ? (
            <span>#{String(inv.voucher_number).padStart(8, "0")}</span>
          ) : (
            "—"
          )}
        </td>
        <td className="py-2.5 pr-3 text-xs">
          {inv.source_type ? (
            <span className="px-1.5 py-0.5 rounded bg-[var(--foreground)]/8 text-[var(--foreground)]/70">
              {SOURCE_LABELS[inv.source_type] ?? inv.source_type}
            </span>
          ) : (
            <span className="text-[var(--foreground)]/30">—</span>
          )}
        </td>
        <td className="py-2.5 text-[var(--foreground)]/40 text-xs">
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </td>
      </tr>

      {expanded && (
        <tr className="border-b border-gray-800 bg-[var(--foreground)]/2">
          <td colSpan={8} className="px-4 py-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <p className="text-[var(--foreground)]/40 uppercase tracking-wider text-[10px] mb-0.5">Punto de venta</p>
                <p className="font-medium">{inv.point_of_sale ?? "—"}</p>
              </div>
              <div>
                <p className="text-[var(--foreground)]/40 uppercase tracking-wider text-[10px] mb-0.5">Tipo comprobante</p>
                <p className="font-medium">{inv.invoice_type ?? inv.voucher_type ?? "—"}</p>
              </div>
              <div>
                <p className="text-[var(--foreground)]/40 uppercase tracking-wider text-[10px] mb-0.5">Tipo documento</p>
                <p className="font-medium">
                  {inv.doc_type ? `${DOC_TYPE_LABELS[inv.doc_type] ?? inv.doc_type}` : "—"}
                </p>
              </div>
              <div>
                <p className="text-[var(--foreground)]/40 uppercase tracking-wider text-[10px] mb-0.5">Nro. documento</p>
                <p className="font-medium">{inv.doc_number ?? "—"}</p>
              </div>
              <div>
                <p className="text-[var(--foreground)]/40 uppercase tracking-wider text-[10px] mb-0.5">Vto. CAE</p>
                <p className="font-medium">{inv.cae_due_date ?? "—"}</p>
              </div>
              {inv.source_id && (
                <div>
                  <p className="text-[var(--foreground)]/40 uppercase tracking-wider text-[10px] mb-0.5">ID origen</p>
                  <p className="font-medium">#{inv.source_id}</p>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────

export default function ArcaPage() {
  const popup = usePopup();
  const {
    data: config,
    loading: loadingConfig,
    refetch: refetchConfig,
  } = useFetchOnce<ArcaConfig>("arcaConfig", getArcaConfig);
  const {
    data: status,
    loading: loadingStatus,
    refetch: refetchStatus,
  } = useFetchOnce<ArcaStatus>("arcaStatus", getArcaStatus);

  // Config form
  const [environment, setEnvironment] = useState<ArcaEnvironment>("mock");
  const [cuit, setCuit] = useState("");
  const [pointOfSale, setPointOfSale] = useState("");
  const [wsaaUrl, setWsaaUrl] = useState("");
  const [wsfeUrl, setWsfeUrl] = useState("");
  const [certPem, setCertPem] = useState("");
  const [keyPem, setKeyPem] = useState("");
  const [keyPassphrase, setKeyPassphrase] = useState("");
  const [savingConfig, setSavingConfig] = useState(false);

  // Emisión manual
  const [emitTotal, setEmitTotal] = useState("");
  const [emitCustomerName, setEmitCustomerName] = useState("");
  const [emitDocType, setEmitDocType] = useState<ArcaDocType>(99);
  const [emitDocNumber, setEmitDocNumber] = useState("");
  const [emitting, setEmitting] = useState(false);

  // Filtros de comprobantes
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Invoices (con recarga manual por filtros)
  const [invoices, setInvoices] = useState<ArcaInvoiceRecord[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [initialInvoicesLoaded, setInitialInvoicesLoaded] = useState(false);

  const loadInvoices = useCallback(async () => {
    setLoadingInvoices(true);
    try {
      const data = await getArcaInvoices({
        limit: 100,
        status: filterStatus || undefined,
        sourceType: filterSource || undefined,
        dateFrom: filterDateFrom || undefined,
        dateTo: filterDateTo || undefined,
      });
      setInvoices(data);
    } catch {
      setInvoices([]);
    } finally {
      setLoadingInvoices(false);
      setInitialInvoicesLoaded(true);
    }
  }, [filterStatus, filterSource, filterDateFrom, filterDateTo]);

  useEffect(() => {
    void loadInvoices();
  }, [loadInvoices]);

  useEffect(() => {
    if (!config) return;
    setEnvironment(config.environment ?? "mock");
    setCuit(config.cuit ?? "");
    setPointOfSale(config.point_of_sale ? String(config.point_of_sale) : "");
    setWsaaUrl(config.wsaa_url ?? "");
    setWsfeUrl(config.wsfe_url ?? "");
  }, [config]);

  // Métricas
  const metrics = useMemo(() => {
    const thisMonth = new Date();
    const monthStart = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1).toISOString();
    const monthInvoices = invoices.filter(
      (inv) => inv.created_at && inv.created_at >= monthStart
    );
    const totalMonth = monthInvoices.reduce((acc, inv) => acc + Number(inv.total), 0);
    const lastCae = invoices.find((inv) => inv.cae)?.cae ?? null;
    return {
      totalMonth,
      countMonth: monthInvoices.length,
      totalAll: invoices.length,
      lastCae,
    };
  }, [invoices]);

  const readyLabel = useMemo(() => {
    if (!status) return "";
    return status.ready ? "Listo para emitir" : "Faltan datos de ARCA";
  }, [status]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const payload: Record<string, unknown> = {
        environment,
        cuit: cuit.trim() || null,
        pointOfSale: pointOfSale ? Number(pointOfSale) : null,
        wsaaUrl: wsaaUrl.trim() || null,
        wsfeUrl: wsfeUrl.trim() || null,
      };
      if (certPem.trim()) payload.certPem = certPem.trim();
      if (keyPem.trim()) payload.keyPem = keyPem.trim();
      if (keyPassphrase.trim()) payload.keyPassphrase = keyPassphrase.trim();

      await updateArcaConfig(payload);
      setCertPem("");
      setKeyPem("");
      setKeyPassphrase("");
      popup.open("Configuración ARCA guardada", true);
      await Promise.all([refetchConfig(), refetchStatus()]);
    } catch (err) {
      console.error(err);
      popup.open("Error al guardar configuración ARCA", false);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleEmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const total = Number(emitTotal);
    if (!total || total <= 0) {
      popup.open("Ingresá un total válido", false);
      return;
    }
    setEmitting(true);
    try {
      const result = await emitArcaInvoice({
        total,
        customerName: emitCustomerName.trim() || undefined,
        docType: emitDocType,
        docNumber: emitDocNumber.trim() || undefined,
        sourceType: "manual",
      });
      if (!result.success) {
        popup.open(result.error ?? "No se pudo emitir", false);
      } else {
        popup.open(`Comprobante emitido · CAE: ${result.cae}`, true);
        setEmitTotal("");
        setEmitCustomerName("");
        setEmitDocNumber("");
        setEmitDocType(99);
        await loadInvoices();
      }
    } catch (err) {
      console.error(err);
      popup.open("Error al emitir comprobante", false);
    } finally {
      setEmitting(false);
    }
  };

  const isInitialLoading = loadingConfig || loadingStatus || !initialInvoicesLoaded;
  const hasActiveFilters = !!(filterStatus || filterSource || filterDateFrom || filterDateTo);

  return (
    <div className="w-full space-y-6">
      <div className="border-b border-slate-800/40 pb-4">
        <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
          Facturación Electrónica ARCA
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Emisión de comprobantes, gestión de certificados fiscales y registro de facturas
        </p>
      </div>

      {isInitialLoading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : (
        <>
          {/* ── Métricas ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <MetricCard
              label="Facturado este mes"
              value={`$${metrics.totalMonth.toLocaleString("es-AR", { minimumFractionDigits: 0 })}`}
              sub={`${metrics.countMonth} comprobante${metrics.countMonth !== 1 ? "s" : ""}`}
              icon={Receipt}
              color="accent"
            />
            <MetricCard
              label="Total comprobantes"
              value={metrics.totalAll}
              icon={FileText}
              color="green"
            />
            <MetricCard
              label="Estado ARCA"
              value={status?.ready ? "Listo" : "Incompleto"}
              sub={ENV_LABELS[status?.environment ?? "mock"]}
              icon={status?.ready ? CheckCircle : XCircle}
              color={status?.ready ? "green" : "yellow"}
            />
            <MetricCard
              label="Último CAE"
              value={metrics.lastCae ? metrics.lastCae.slice(-6) : "—"}
              sub={metrics.lastCae ? `...${metrics.lastCae.slice(-6)}` : "Sin comprobantes"}
              icon={CheckCircle}
              color="green"
            />
          </div>

          {/* ── Configuración ARCA ────────────────────────────────────── */}
          <section className="bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <h2 className="text-base font-bold text-[var(--foreground)]">Configuración ARCA</h2>
          {status && (
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                status.ready
                  ? "bg-green-500/20 text-green-300"
                  : "bg-yellow-500/20 text-yellow-300"
              }`}
            >
              {readyLabel}
            </span>
          )}
        </div>

        <form onSubmit={handleSaveConfig} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <label className="block font-medium mb-1">Entorno</label>
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value as ArcaEnvironment)}
              className="w-full border rounded px-3 py-2 text-sm bg-transparent"
            >
              <option value="mock">{ENV_LABELS.mock}</option>
              <option value="homo">{ENV_LABELS.homo}</option>
              <option value="prod">{ENV_LABELS.prod}</option>
            </select>
          </div>

          <div>
            <label className="block font-medium mb-1">CUIT</label>
            <input
              value={cuit}
              onChange={(e) => setCuit(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="20xxxxxxxxx"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Punto de venta</label>
            <input
              value={pointOfSale}
              onChange={(e) => setPointOfSale(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="1"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">WSAA URL</label>
            <input
              value={wsaaUrl}
              onChange={(e) => setWsaaUrl(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="https://.../LoginCms"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">WSFE URL</label>
            <input
              value={wsfeUrl}
              onChange={(e) => setWsfeUrl(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="https://.../wsfev1/service.asmx"
            />
          </div>

          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Certificado (PEM)</label>
              <textarea
                value={certPem}
                onChange={(e) => setCertPem(e.target.value)}
                className="w-full border rounded px-3 py-2 text-xs h-28"
                placeholder="Pegá el certificado PEM (opcional)"
              />
              {config && (
                <p className="text-xs text-gray-400 mt-1">
                  {config.has_cert ? "✓ Certificado cargado" : "Sin certificado"}
                </p>
              )}
            </div>

            <div>
              <label className="block font-medium mb-1">Clave privada (PEM)</label>
              <textarea
                value={keyPem}
                onChange={(e) => setKeyPem(e.target.value)}
                className="w-full border rounded px-3 py-2 text-xs h-28"
                placeholder="Pegá la clave PEM (opcional)"
              />
              {config && (
                <p className="text-xs text-gray-400 mt-1">
                  {config.has_key ? "✓ Clave cargada" : "Sin clave"}
                </p>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block font-medium mb-1">Passphrase (opcional)</label>
            <input
              value={keyPassphrase}
              onChange={(e) => setKeyPassphrase(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Solo si tu clave tiene contraseña"
              type="password"
            />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <SaveButton type="submit" disabled={savingConfig} loading={savingConfig} className="max-w-xs" />
          </div>
        </form>
      </section>

      {/* ── Emitir comprobante manual ─────────────────────────────── */}
      <section className="bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <h2 className="text-base font-bold text-[var(--foreground)]">Emitir comprobante</h2>
          {status && !status.ready && (
            <span className="text-xs text-yellow-300">Configurá ARCA para emitir</span>
          )}
        </div>

        <form onSubmit={handleEmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <label className="block font-medium mb-1">Total</label>
            <input
              type="number"
              value={emitTotal}
              onChange={(e) => setEmitTotal(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Cliente (opcional)</label>
            <input
              value={emitCustomerName}
              onChange={(e) => setEmitCustomerName(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Consumidor final"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Tipo de documento</label>
            <select
              value={emitDocType}
              onChange={(e) => setEmitDocType(Number(e.target.value) as ArcaDocType)}
              className="w-full border rounded px-3 py-2 text-sm bg-transparent"
            >
              {DOC_TYPES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {emitDocType !== 99 && (
            <div className="md:col-span-3">
              <label className="block font-medium mb-1">Número de documento</label>
              <input
                value={emitDocNumber}
                onChange={(e) => setEmitDocNumber(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder={emitDocType === 80 ? "20-XXXXXXXX-X" : "XX.XXX.XXX"}
              />
            </div>
          )}

          <div className="md:col-span-3 flex justify-end">
            <SendButton
              type="submit"
              disabled={!status?.ready || emitting}
              loading={emitting}
              className="max-w-xs"
            />
          </div>
        </form>
      </section>

      {/* ── Comprobantes emitidos ─────────────────────────────────── */}
      <section className="bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-base font-bold text-[var(--foreground)]">Comprobantes emitidos</h2>
          <div className="flex items-center gap-2">
            {/* Exportar CSV */}
            {invoices.length > 0 && (
              <button
                type="button"
                onClick={() => exportToCsv(invoices)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg !border !border-[var(--foreground)]/20 hover:!border-[var(--accent)]/50 !bg-white/5 !text-slate-200 hover:!text-[var(--accent)] transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Exportar CSV
              </button>
            )}
            {/* Toggle filtros */}
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg !border transition-colors cursor-pointer ${
                hasActiveFilters
                  ? "!border-[var(--accent)]/50 !text-[var(--accent)] !bg-[var(--accent)]/10 font-bold"
                  : "!border-[var(--foreground)]/20 !text-slate-200 !bg-white/5 hover:!border-[var(--accent)]/50 hover:!text-[var(--accent)]"
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              Filtros{hasActiveFilters ? " (activos)" : ""}
            </button>
          </div>
        </div>

        {/* Panel de filtros */}
        {filtersOpen && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-3 bg-[var(--foreground)]/3 rounded-lg text-sm">
            <div>
              <label className="block text-xs text-[var(--foreground)]/50 mb-1">Estado</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border rounded px-2 py-1.5 text-xs bg-transparent"
              >
                <option value="">Todos</option>
                <option value="mock">Demo</option>
                <option value="approved">Aprobado</option>
                <option value="rejected">Rechazado</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[var(--foreground)]/50 mb-1">Origen</label>
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="w-full border rounded px-2 py-1.5 text-xs bg-transparent"
              >
                <option value="">Todos</option>
                <option value="appointment">Turnos</option>
                <option value="sale">Ventas</option>
                <option value="manual">Manual</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[var(--foreground)]/50 mb-1">Desde</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="w-full border rounded px-2 py-1.5 text-xs bg-transparent"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--foreground)]/50 mb-1">Hasta</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="w-full border rounded px-2 py-1.5 text-xs bg-transparent"
              />
            </div>
            {hasActiveFilters && (
              <div className="col-span-2 md:col-span-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setFilterStatus("");
                    setFilterSource("");
                    setFilterDateFrom("");
                    setFilterDateTo("");
                  }}
                  className="text-xs !bg-transparent !text-slate-400 hover:!text-red-400 transition-colors cursor-pointer underline underline-offset-2"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
        )}

        {loadingInvoices && (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        )}

        {!loadingInvoices && invoices.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">
            {hasActiveFilters
              ? "No hay comprobantes con los filtros seleccionados."
              : "No hay comprobantes registrados."}
          </p>
        )}

        {invoices.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs md:text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-left text-[var(--foreground)]/50 text-[11px] uppercase tracking-wider">
                  <th className="py-2 pr-3">Fecha</th>
                  <th className="py-2 pr-3">Estado</th>
                  <th className="py-2 pr-3">Total</th>
                  <th className="py-2 pr-3">Cliente</th>
                  <th className="py-2 pr-3">CAE</th>
                  <th className="py-2 pr-3">Nro.</th>
                  <th className="py-2 pr-3">Origen</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <InvoiceRow key={inv.id} inv={inv} />
                ))}
              </tbody>
            </table>
            <p className="text-xs text-[var(--foreground)]/30 mt-3 text-right">
              {invoices.length} comprobante{invoices.length !== 1 ? "s" : ""}
              {hasActiveFilters ? " (filtrados)" : ""}
            </p>
          </div>
        )}
      </section>
        </>
      )}

      {popup.show && (
        <PopupModal
          message={popup.message}
          success={popup.success}
          onClose={() => popup.close()}
        />
      )}
    </div>
  );
}
