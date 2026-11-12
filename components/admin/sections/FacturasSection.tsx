"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArcaSkeleton } from "@/components/loading/Skeleton";
import SendButton from "@/components/buttons/SendButton";
import { ActionButton } from "@/components/buttons/ActionButton";
import { toast } from "@/lib/store/useToastStore";
import { useFetchOnce } from "@/lib/hooks/useFetchOnce";
import {
  emitArcaInvoice,
  emitCreditNote,
  getArcaConfig,
  getArcaInvoices,
  getArcaStatus,
  verifyArcaInvoice,
} from "@/lib/repository/arca";
import type {
  ArcaConfig,
  ArcaDocType,
  ArcaEnvironment,
  ArcaInvoiceRecord,
  ArcaStatus,
} from "@/lib/types/Arca";
import ArcaDocFields from "@/components/arca/ArcaDocFields";
import InvoiceReceipt from "@/components/arca/InvoiceReceipt";
import { CONSUMIDOR_FINAL } from "@/lib/arca/receiverConditions";
import { todayInArgentina } from "@/lib/dates/argentina";
import { Appointment } from "@/lib/types/Appointment";
import {
  Receipt,
  ChevronDown,
  ChevronUp,
  Download,
  Filter,
  Calendar,
  AlertTriangle,
  Zap,
  Clock,
  Loader2,
  Plus,
  ArrowLeft,
  RefreshCw,
  FileText,
  RotateCcw,
} from "lucide-react";

// ─── Constantes ────────────────────────────────────────────────────────────

const ENV_LABELS: Record<ArcaEnvironment, string> = {
  homo: "Homologación",
  prod: "Producción",
};

const STATUS_LABELS: Record<string, string> = {
  approved: "Aprobado",
  rejected: "Rechazado",
  pending: "En proceso",
  error: "Sin respuesta",
  voided: "Anulada",
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

type ArcaPeriod = "daily" | "weekly" | "biweekly" | "monthly" | "custom";

function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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
        <p className="text-xs font-medium opacity-70 tracking-wider">{label}</p>
        <p className="text-xl font-bold">{value}</p>
        {sub && <p className="text-[10px] opacity-60 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function InvoiceRow({
  inv,
  onVerified,
  onViewReceipt,
  onVoid,
}: {
  inv: ArcaInvoiceRecord;
  onVerified: () => void;
  onViewReceipt: (id: number) => void;
  onVoid: (inv: ArcaInvoiceRecord) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (verifying) return;
    setVerifying(true);
    try {
      const res = await verifyArcaInvoice(inv.id);
      if (res.success) {
        if (res.status === "approved") {
          toast.success("Factura confirmada en ARCA");
        } else {
          toast.info("La factura no se emitió. El cobro quedó libre para facturar");
        }
      } else {
        toast.error(res.error || "No se pudo verificar el comprobante con ARCA");
      }
      onVerified();
    } catch {
      toast.error("No se pudo verificar el comprobante con ARCA");
    } finally {
      setVerifying(false);
    }
  };

  const statusColor =
    inv.status === "approved"
      ? "bg-green-500/10 text-green-300 border-green-500/20"
      : inv.status === "voided"
      ? "bg-slate-500/15 text-slate-400 border-slate-500/30"
      : inv.status === "pending" || inv.status === "error"
      ? "bg-yellow-500/10 text-yellow-300 border-yellow-500/20"
      : "bg-red-500/10 text-red-300 border-red-500/20";

  const statusLabel = STATUS_LABELS[inv.status] ?? inv.status;
  const isType11 = (inv.voucher_type ?? inv.invoice_type) === 11;

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
                <p className="text-[var(--foreground)]/40 tracking-wider text-[10px] mb-0.5">Punto de venta</p>
                <p className="font-medium">{inv.point_of_sale ?? "—"}</p>
              </div>
              <div>
                <p className="text-[var(--foreground)]/40 tracking-wider text-[10px] mb-0.5">Tipo comprobante</p>
                <p className="font-medium">{inv.invoice_type ?? inv.voucher_type ?? "—"}</p>
              </div>
              <div>
                <p className="text-[var(--foreground)]/40 tracking-wider text-[10px] mb-0.5">Tipo documento</p>
                <p className="font-medium">
                  {inv.doc_type ? `${DOC_TYPE_LABELS[inv.doc_type] ?? inv.doc_type}` : "—"}
                </p>
              </div>
              <div>
                <p className="text-[var(--foreground)]/40 tracking-wider text-[10px] mb-0.5">Nro. documento</p>
                <p className="font-medium">{inv.doc_number ?? "—"}</p>
              </div>
              <div>
                <p className="text-[var(--foreground)]/40 tracking-wider text-[10px] mb-0.5">Vto. CAE</p>
                <p className="font-medium">{inv.cae_due_date ?? "—"}</p>
              </div>
              {inv.source_id && (
                <div>
                  <p className="text-[var(--foreground)]/40 tracking-wider text-[10px] mb-0.5">ID origen</p>
                  <p className="font-medium">#{inv.source_id}</p>
                </div>
              )}
            </div>
            {(inv.status === "approved" || inv.status === "voided") && inv.cae && (
              <div className="mt-3 flex flex-wrap items-center gap-2 pt-3 border-t border-[var(--foreground)]/10">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewReceipt(inv.id);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--foreground)]/20 hover:border-[var(--accent)]/50 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 hover:text-[var(--accent)] transition-all cursor-pointer min-h-[44px] sm:min-h-0"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Ver comprobante</span>
                </button>

                {inv.status === "approved" && isType11 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onVoid(inv);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 hover:border-rose-500/60 bg-rose-500/10 hover:bg-rose-500/20 text-xs font-semibold text-rose-300 hover:text-rose-200 transition-all cursor-pointer min-h-[44px] sm:min-h-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Anular con nota de crédito</span>
                  </button>
                )}
              </div>
            )}
            {(inv.status === "error" || inv.status === "pending") && (
              <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-xs text-yellow-300">
                  ARCA no respondió y puede haberla autorizado igual. Verificala antes de volver a facturar.
                </p>
                <ActionButton
                  name="Verificar en ARCA"
                  Icon={RefreshCw}
                  loading={verifying}
                  onClick={handleVerify}
                  className="min-h-[44px] shrink-0 text-xs"
                />
              </div>
            )}
            {inv.status === "rejected" && inv.error_message && (
              <p className="mt-3 text-xs text-red-300 break-words">
                Motivo: {inv.error_message}
              </p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Componente Principal de Sección ───────────────────────────────────────

export default function FacturasSection() {
  const [viewMode, setViewMode] = useState<"list" | "emit" | "receipt" | "void">("list");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [voidingInvoice, setVoidingInvoice] = useState<ArcaInvoiceRecord | null>(null);
  const [voidingLoading, setVoidingLoading] = useState(false);

  const {
    data: config,
    loading: loadingConfig,
  } = useFetchOnce<ArcaConfig>("arcaConfig", getArcaConfig);
  const {
    data: status,
    loading: loadingStatus,
  } = useFetchOnce<ArcaStatus>("arcaStatus", getArcaStatus);
  const currentEnvironment = status?.environment ?? config?.environment;
  const isHomo = currentEnvironment === "homo";

  const certExpiryNotice = useMemo(() => {
    if (!status?.cert_expires_at) return null;
    const expiry = new Date(status.cert_expires_at);
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const day = String(expiry.getDate()).padStart(2, "0");
    const month = String(expiry.getMonth() + 1).padStart(2, "0");
    const year = expiry.getFullYear();
    const dateFormatted = `${day}/${month}/${year}`;

    if (diffMs <= 0) {
      return `El certificado de ARCA venció el ${dateFormatted}`;
    }
    if (diffMs <= thirtyDaysMs) {
      return `El certificado de ARCA vence el ${dateFormatted}. Renovalo para seguir facturando`;
    }
    return null;
  }, [status?.cert_expires_at]);

  // Período de facturación ARCA (diario, semanal, quincenal, mensual, personalizado)
  const [periodPreset, setPeriodPreset] = useState<ArcaPeriod>("monthly");

  const todayStr = useMemo(() => formatDateISO(new Date()), []);
  const [customStart, setCustomStart] = useState<string>(() => {
    const d = new Date();
    return formatDateISO(new Date(d.getFullYear(), d.getMonth(), 1));
  });
  const [customEnd, setCustomEnd] = useState<string>(() => {
    const d = new Date();
    return formatDateISO(new Date(d.getFullYear(), d.getMonth() + 1, 0));
  });

  // Cálculo de fechas y duración del período fiscal
  const { periodStart, periodEnd, daysCount, isPeriodValid } = useMemo(() => {
    const now = new Date();
    let s = "";
    let e = "";

    if (periodPreset === "daily") {
      s = todayStr;
      e = todayStr;
    } else if (periodPreset === "weekly") {
      const day = now.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      s = formatDateISO(monday);
      e = formatDateISO(sunday);
    } else if (periodPreset === "biweekly") {
      const currentDay = now.getDate();
      if (currentDay <= 15) {
        s = formatDateISO(new Date(now.getFullYear(), now.getMonth(), 1));
        e = formatDateISO(new Date(now.getFullYear(), now.getMonth(), 15));
      } else {
        s = formatDateISO(new Date(now.getFullYear(), now.getMonth(), 16));
        e = formatDateISO(new Date(now.getFullYear(), now.getMonth() + 1, 0));
      }
    } else if (periodPreset === "monthly") {
      s = formatDateISO(new Date(now.getFullYear(), now.getMonth(), 1));
      e = formatDateISO(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    } else {
      s = customStart;
      e = customEnd;
    }

    const startDateObj = new Date(s);
    const endDateObj = new Date(e);
    const diffTime = endDateObj.getTime() - startDateObj.getTime();
    const count = Math.round(diffTime / (1000 * 3600 * 24)) + 1;
    // ARCA: Períodos de facturación para servicios no pueden superar 31 días (1 mes)
    const valid = count > 0 && count <= 31;

    return {
      periodStart: s,
      periodEnd: e,
      daysCount: count,
      isPeriodValid: valid,
    };
  }, [periodPreset, todayStr, customStart, customEnd]);

  // Turnos en el período (facturados vs pendientes de facturar)
  const [periodAppointments, setPeriodAppointments] = useState<Appointment[]>([]);
  const [batchBilling, setBatchBilling] = useState(false);
  const [confirmBatch, setConfirmBatch] = useState(false);

  // Emisión manual
  const [emitTotal, setEmitTotal] = useState("");
  const [emitCustomerName, setEmitCustomerName] = useState("");
  const [emitDocType, setEmitDocType] = useState<ArcaDocType>(99);
  const [emitDocNumber, setEmitDocNumber] = useState("");
  const [emitReceiverCondition, setEmitReceiverCondition] = useState(CONSUMIDOR_FINAL);
  const [emitting, setEmitting] = useState(false);

  // Filtros de comprobantes emitidos
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Invoices
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
        dateFrom: periodStart || undefined,
        dateTo: periodEnd || undefined,
        environment: currentEnvironment || undefined,
      });
      setInvoices(data);
    } catch {
      setInvoices([]);
    } finally {
      setLoadingInvoices(false);
      setInitialInvoicesLoaded(true);
    }
  }, [filterStatus, filterSource, periodStart, periodEnd, currentEnvironment]);

  const loadPeriodAppointments = useCallback(async () => {
    if (!periodStart || !periodEnd) return;
    try {
      const res = await fetch(`/api/appointments?start_date=${periodStart}&end_date=${periodEnd}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setPeriodAppointments(data);
        }
      }
    } catch (err) {
      console.error("Error al cargar turnos del período:", err);
    }
  }, [periodStart, periodEnd]);

  useEffect(() => {
    void loadInvoices();
    void loadPeriodAppointments();
  }, [loadInvoices, loadPeriodAppointments]);

  // Turnos pendientes de facturar en el período
  const unbilledAppointments = useMemo(() => {
    return periodAppointments.filter(
      (a) => !a.arca_invoice_id && a.paid && a.price && a.price > 0 && a.phone !== "0000000000"
    );
  }, [periodAppointments]);

  const unbilledTotal = useMemo(() => {
    return unbilledAppointments.reduce((acc, a) => acc + (a.price || 0), 0);
  }, [unbilledAppointments]);

  // Facturado comprobantes en el período: solo facturas tipo 11 aprobadas
  const approvedType11Invoices = useMemo(() => {
    return invoices.filter(
      (inv) => inv.status === "approved" && (inv.voucher_type === 11 || inv.invoice_type === 11)
    );
  }, [invoices]);

  const periodInvoicesTotal = useMemo(() => {
    return approvedType11Invoices.reduce((acc, inv) => acc + Number(inv.total), 0);
  }, [approvedType11Invoices]);

  const handleConfirmVoid = async () => {
    if (!voidingInvoice) return;
    setVoidingLoading(true);
    try {
      const res = await emitCreditNote(voidingInvoice.id);
      if (!res.success) {
        toast.error(res.error || "No se pudo emitir la nota de crédito");
      } else {
        toast.success(
          res.cae
            ? `Nota de crédito emitida con éxito. CAE: ${res.cae}`
            : "Nota de crédito emitida con éxito"
        );
        await Promise.all([loadInvoices(), loadPeriodAppointments()]);
        setViewMode("list");
        setVoidingInvoice(null);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al anular factura");
    } finally {
      setVoidingLoading(false);
    }
  };

  // Facturación en lote de turnos del período
  const handleBatchInvoice = async () => {
    if (!isPeriodValid) {
      toast.error("El período supera los 31 días permitidos por ARCA.");
      return;
    }
    if (unbilledAppointments.length === 0) {
      toast.error("No hay turnos pendientes de facturación en este período.");
      return;
    }

    setBatchBilling(true);
    let successCount = 0;
    let failureCount = 0;
    try {
      for (const appt of unbilledAppointments) {
        const res = await emitArcaInvoice({
          total: Number(appt.price),
          customerName: appt.client || undefined,
          docType: 99,
          sourceType: "appointment",
          sourceId: appt.id,
        });
        if (res.success) {
          successCount++;
        } else {
          failureCount++;
        }
      }
      if (successCount > 0) {
        toast.success(`Se emitieron ${successCount} comprobantes.`);
      }
      if (failureCount > 0) {
        toast.error(`No se pudieron emitir ${failureCount} comprobantes.`);
      }
      setConfirmBatch(false);
      await Promise.all([loadInvoices(), loadPeriodAppointments()]);
      setViewMode("list");
    } catch (err) {
      console.error(err);
      toast.error("Ocurrió un error durante la facturación en lote.");
    } finally {
      setBatchBilling(false);
    }
  };

  // Emisión manual individual
  const handleEmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseFloat(emitTotal);
    if (isNaN(total) || total <= 0) {
      toast.error("Ingresá un monto válido");
      return;
    }

    if (emitDocType !== 99 && !emitDocNumber.trim()) {
      toast.error("Ingresá el número de documento del cliente");
      return;
    }

    setEmitting(true);
    try {
      const res = await emitArcaInvoice({
        total,
        customerName: emitCustomerName.trim() || undefined,
        docType: emitDocType,
        docNumber: emitDocNumber.trim() || undefined,
        receiverIvaCondition: emitReceiverCondition,
        sourceType: "manual",
      });

      if (!res.success) {
        toast.error(res.error ?? "Error al emitir comprobante");
      } else {
        if (res.cae) {
          toast.success(`Factura emitida. CAE: ${res.cae}`);
        } else {
          toast.success("Factura emitida");
        }
        setEmitTotal("");
        setEmitCustomerName("");
        setEmitDocNumber("");
        setEmitDocType(99);
        setEmitReceiverCondition(CONSUMIDOR_FINAL);
        await Promise.all([loadInvoices(), loadPeriodAppointments()]);
        setViewMode("list");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al emitir comprobante");
    } finally {
      setEmitting(false);
    }
  };

  const isInitialLoading = loadingConfig || loadingStatus || !initialInvoicesLoaded;
  const hasActiveFilters = !!(filterStatus || filterSource);

  if (isInitialLoading) {
    return (
      <div className="w-full space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
              Comprobantes
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Historial y registro de facturación electrónica ARCA con CAE
            </p>
          </div>
        </div>
        <ArcaSkeleton />
      </div>
    );
  }

  // ── MODO 3: VER COMPROBANTE ───────────────────────────────────────────────
  if (viewMode === "receipt" && selectedInvoiceId) {
    return (
      <InvoiceReceipt
        invoiceId={selectedInvoiceId}
        onBack={() => {
          setSelectedInvoiceId(null);
          setViewMode("list");
        }}
      />
    );
  }

  // ── MODO 4: ANULAR CON NOTA DE CRÉDITO (CONFIRMACIÓN EN PANTALLA) ─────────
  if (viewMode === "void" && voidingInvoice) {
    const isAppointment = voidingInvoice.source_type === "appointment";
    const isSale = voidingInvoice.source_type === "sale";
    const originLabel = isAppointment ? "el turno" : isSale ? "la venta" : null;

    return (
      <div className="space-y-6 animate-in fade-in duration-300 w-full max-w-2xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-5">
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => {
                setVoidingInvoice(null);
                setViewMode("list");
              }}
              className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-[var(--accent)] hover:text-white transition-colors cursor-pointer group mb-1"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Volver a comprobantes</span>
            </button>
            <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              Anular factura con nota de crédito
            </h2>
            <p className="text-xs text-slate-400">
              Confirmación de emisión oficial de Nota de crédito C ante ARCA
            </p>
          </div>
        </div>

        {/* Resumen del comprobante a anular */}
        <section className="bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 rounded-2xl p-5 sm:p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--foreground)]/10 pb-3">
            <div>
              <p className="text-xs text-slate-400">Factura a anular</p>
              <h3 className="text-base font-bold text-white">
                Factura C #{String(voidingInvoice.voucher_number ?? 0).padStart(8, "0")}
              </h3>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Monto total</p>
              <p className="text-lg font-mono font-bold text-rose-400">
                ${Number(voidingInvoice.total).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-slate-400 mb-0.5">Punto de venta</p>
              <p className="font-medium text-slate-200">{voidingInvoice.point_of_sale ?? "—"}</p>
            </div>
            <div>
              <p className="text-slate-400 mb-0.5">CAE original</p>
              <p className="font-medium text-slate-200 font-mono">{voidingInvoice.cae ?? "—"}</p>
            </div>
            <div>
              <p className="text-slate-400 mb-0.5">Cliente</p>
              <p className="font-medium text-slate-200">{voidingInvoice.customer_name || "Consumidor final"}</p>
            </div>
            <div>
              <p className="text-slate-400 mb-0.5">Fecha de emisión</p>
              <p className="font-medium text-slate-200">
                {voidingInvoice.voucher_date
                  ? voidingInvoice.voucher_date
                  : voidingInvoice.created_at
                  ? todayInArgentina(new Date(voidingInvoice.created_at))
                  : "—"}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs space-y-1.5">
            <p className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Efecto fiscal y en el sistema</span>
            </p>
            <p className="text-[11px] leading-relaxed opacity-90">
              Se emitirá una Nota de crédito C oficial por el total de ${Number(voidingInvoice.total).toLocaleString("es-AR", { minimumFractionDigits: 2 })} vinculada a esta factura.
              La factura original pasará a estado <strong>Anulada</strong>
              {originLabel ? ` y ${originLabel} quedará liberado para volver a facturarse cuando lo desees.` : "."}
            </p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-[var(--foreground)]/10">
            <button
              type="button"
              disabled={voidingLoading}
              onClick={() => {
                setVoidingInvoice(null);
                setViewMode("list");
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[var(--foreground)]/20 text-xs text-slate-300 hover:bg-white/5 font-semibold transition-all cursor-pointer disabled:opacity-40 min-h-[44px]"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={voidingLoading}
              onClick={handleConfirmVoid}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl !bg-rose-500 hover:!bg-rose-600 !text-white font-bold text-xs shadow-md shadow-rose-500/20 transition-all cursor-pointer disabled:opacity-40 min-h-[44px]"
            >
              {voidingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              <span>Emitir nota de crédito</span>
            </button>
          </div>
        </section>
      </div>
    );
  }

  // ── MODO 2: EMITIR FACTURA (PANEL DE ACCIÓN) ──────────────────────────────
  if (viewMode === "emit") {
    return (
      <div className="space-y-6 animate-in fade-in duration-300 w-full">
        {isHomo && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-medium">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
            <span>Homologación: los comprobantes son de prueba en ARCA y no tienen validez fiscal.</span>
          </div>
        )}
        {certExpiryNotice && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-medium">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
            <span>{certExpiryNotice}</span>
          </div>
        )}
        {/* Cabecera con botón Volver arriba a la izquierda estilo estándar de /admin */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-5">
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-[var(--accent)] hover:text-white transition-colors cursor-pointer group mb-1"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Volver a comprobantes</span>
            </button>
            <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              Emitir comprobante
            </h2>
            <p className="text-xs text-slate-400">
              Facturación en lote de turnos completados o emisión manual individual
            </p>
          </div>
        </div>

        {/* Alerta si ARCA no está listo */}
        {status && !status.ready && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs animate-in fade-in">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
            <span>
              Faltan datos de configuración en ARCA. Podés emitir en modo Demo o completar tus credenciales fiscales desde el menú lateral en <strong>Configuración ARCA</strong>.
            </span>
          </div>
        )}

        {/* ── Selector de Período para Turnos ──────────────────────── */}
        <div className="bg-[var(--foreground)]/5 p-4 rounded-2xl border border-[var(--foreground)]/10 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Calendar className="w-4 h-4 text-[var(--accent)]" />
              <span>Período de turnos a facturar:</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(["daily", "weekly", "biweekly", "monthly", "custom"] as ArcaPeriod[]).map((p) => {
                const labels: Record<ArcaPeriod, string> = {
                  daily: "Diario",
                  weekly: "Semanal",
                  biweekly: "Quincenal",
                  monthly: "Mensual",
                  custom: "Personalizado",
                };
                const isActive = periodPreset === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriodPreset(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? "!bg-[var(--accent)] !text-slate-950 font-bold shadow-sm"
                        : "!text-slate-400 hover:!text-white hover:!bg-white/5"
                    }`}
                  >
                    {labels[p]}
                  </button>
                );
              })}
            </div>
          </div>

          {periodPreset === "custom" && (
            <div className="pt-3 border-t border-[var(--foreground)]/10 flex flex-wrap items-center gap-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <label htmlFor="arca-emit-start" className="text-xs text-slate-400 font-medium">Desde:</label>
                <input
                  id="arca-emit-start"
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="p-1.5 rounded-lg border border-[var(--foreground)]/15 bg-[var(--background)] text-xs text-[var(--foreground)] focus:border-[var(--accent)] outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="arca-emit-end" className="text-xs text-slate-400 font-medium">Hasta:</label>
                <input
                  id="arca-emit-end"
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="p-1.5 rounded-lg border border-[var(--foreground)]/15 bg-[var(--background)] text-xs text-[var(--foreground)] focus:border-[var(--accent)] outline-none"
                />
              </div>

              <span className="text-xs text-slate-400">
                Duración: <strong className={daysCount > 31 ? "text-rose-400" : "text-emerald-400"}>{daysCount} días</strong>
              </span>
            </div>
          )}

          {!isPeriodValid && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>
                Por normativa de ARCA, el período a facturar no puede superar 31 días corridos. Por favor ajustá las fechas.
              </span>
            </div>
          )}
        </div>

        {/* ── Opción 1: Lote de Facturación de Turnos ───────────────── */}
        <section className="bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 rounded-2xl p-5 sm:p-6 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-white font-bold text-base mb-1">
                <Zap className="w-4 h-4 text-[var(--accent)]" />
                <span>Facturación en lote de turnos</span>
              </div>
              <p className="text-xs text-slate-400">
                {unbilledAppointments.length > 0 ? (
                  <>
                    Hay <strong className="text-amber-400 font-bold">{unbilledAppointments.length} turnos</strong> pendientes de facturación en el período seleccionado por un total de{" "}
                    <strong className="text-emerald-400 font-bold">
                      ${unbilledTotal.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
                    </strong>.
                  </>
                ) : (
                  "Todos los turnos de este período ya fueron facturados o no presentan saldo pendiente."
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setConfirmBatch(true)}
              disabled={!status?.ready || batchBilling || unbilledAppointments.length === 0 || !isPeriodValid}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl !bg-[var(--accent)] hover:!bg-[var(--accent-hover)] !text-slate-950 font-bold text-xs transition-all cursor-pointer shadow-md shadow-[var(--accent)]/15 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap active:scale-95 self-start sm:self-auto min-h-[44px] sm:min-h-0"
            >
              {batchBilling ? (
                <Loader2 className="w-4 h-4 animate-spin text-inherit" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              <span>Facturar turnos pendientes</span>
            </button>
          </div>

          {confirmBatch && (
            <div className="mt-4 pt-4 border-t border-[var(--foreground)]/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-in fade-in duration-200">
              <p className="text-xs text-slate-200">
                Vas a emitir {unbilledAppointments.length} comprobantes por ${unbilledTotal.toLocaleString("es-AR", { minimumFractionDigits: 0 })}. ¿Confirmás?
              </p>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  disabled={batchBilling}
                  onClick={() => setConfirmBatch(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-[var(--foreground)]/20 text-xs text-slate-300 hover:bg-white/5 font-medium transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] sm:min-h-0"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={batchBilling}
                  onClick={handleBatchInvoice}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-xl !bg-[var(--accent)] hover:!bg-[var(--accent-hover)] !text-slate-950 font-bold text-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] sm:min-h-0"
                >
                  {batchBilling && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Sí, emitir</span>
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ── Opción 2: Emisión Manual Individual ───────────────────── */}
        <section className="bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 rounded-2xl p-5 sm:p-6 shadow-lg space-y-4">
          <div className="flex items-center gap-2 text-[var(--foreground)] font-bold text-base border-b border-[var(--foreground)]/10 pb-3">
            <Receipt className="w-4 h-4 text-[var(--accent)]" />
            <span>Emitir comprobante individual manual</span>
          </div>

          <form onSubmit={handleEmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Monto total <span className="text-[var(--accent)]">*</span>
              </label>
              <input
                type="number"
                value={emitTotal}
                onChange={(e) => setEmitTotal(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-sm bg-transparent border-[var(--foreground)]/15 focus:border-[var(--accent)] outline-none"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Cliente (opcional)
              </label>
              <input
                value={emitCustomerName}
                onChange={(e) => setEmitCustomerName(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-sm bg-transparent border-[var(--foreground)]/15 focus:border-[var(--accent)] outline-none"
                placeholder="Consumidor final"
              />
            </div>

            <ArcaDocFields
              idPrefix="factura-emit"
              docType={emitDocType}
              onDocTypeChange={setEmitDocType}
              docNumber={emitDocNumber}
              onDocNumberChange={setEmitDocNumber}
              receiverCondition={emitReceiverCondition}
              onReceiverConditionChange={setEmitReceiverCondition}
              numberClassName="md:col-span-3"
            />

            <div className="md:col-span-3 flex justify-end pt-4 border-t border-white/5">
              <SendButton
                name="Emitir comprobante"
                type="submit"
                disabled={!status?.ready || emitting}
                loading={emitting}
                className="w-full sm:w-auto min-w-[200px]"
              />
            </div>
          </form>
        </section>
      </div>
    );
  }

  // ── MODO 1: LISTADO DE COMPROBANTES (VISTA PRINCIPAL POR DEFECTO) ────────
  return (
    <div className="space-y-6 animate-in fade-in duration-300 w-full">
      {isHomo && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-medium">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
          <span>Homologación: los comprobantes son de prueba en ARCA y no tienen validez fiscal.</span>
        </div>
      )}
      {certExpiryNotice && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-medium">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
          <span>{certExpiryNotice}</span>
        </div>
      )}
      {/* Cabecera Estilo Ventas */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
              Comprobantes
            </h2>
            {status?.environment && (
              <span
                className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-md border ${
                  status.environment === "prod"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : status.environment === "homo"
                    ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                    : "bg-amber-500/10 text-amber-300 border-amber-500/20"
                }`}
              >
                {ENV_LABELS[status.environment]}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Historial y registro de facturación electrónica ARCA con CAE
          </p>
        </div>
        <button
          type="button"
          onClick={() => setViewMode("emit")}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl !bg-[var(--accent)] hover:!bg-[var(--accent-hover)] !text-slate-950 font-bold text-sm shadow-md shadow-[var(--accent)]/15 transition-all hover:scale-105 active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Emitir factura</span>
        </button>
      </div>

      {/* ── Selector de Período ARCA ───────────────────────────────── */}
      <div className="bg-[var(--foreground)]/5 p-4 rounded-2xl border border-[var(--foreground)]/10 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Calendar className="w-4 h-4 text-[var(--accent)]" />
            <span>Período a inspeccionar:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(["daily", "weekly", "biweekly", "monthly", "custom"] as ArcaPeriod[]).map((p) => {
              const labels: Record<ArcaPeriod, string> = {
                daily: "Diario",
                weekly: "Semanal",
                biweekly: "Quincenal",
                monthly: "Mensual",
                custom: "Personalizado",
              };
              const isActive = periodPreset === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriodPreset(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? "!bg-[var(--accent)] !text-slate-950 font-bold shadow-sm"
                      : "!text-slate-400 hover:!text-white hover:!bg-white/5"
                  }`}
                >
                  {labels[p]}
                </button>
              );
            })}
          </div>
        </div>

        {periodPreset === "custom" && (
          <div className="pt-3 border-t border-[var(--foreground)]/10 flex flex-wrap items-center gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <label htmlFor="arca-list-start" className="text-xs text-slate-400 font-medium">Desde:</label>
              <input
                id="arca-list-start"
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="p-1.5 rounded-lg border border-[var(--foreground)]/15 bg-[var(--background)] text-xs text-[var(--foreground)] focus:border-[var(--accent)] outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="arca-list-end" className="text-xs text-slate-400 font-medium">Hasta:</label>
              <input
                id="arca-list-end"
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="p-1.5 rounded-lg border border-[var(--foreground)]/15 bg-[var(--background)] text-xs text-[var(--foreground)] focus:border-[var(--accent)] outline-none"
              />
            </div>

            <span className="text-xs text-slate-400">
              Duración: <strong className={daysCount > 31 ? "text-rose-400" : "text-emerald-400"}>{daysCount} días</strong>
            </span>
          </div>
        )}

        {!isPeriodValid && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>
              Por normativa de ARCA, el período no puede superar 31 días corridos. Por favor reducí el rango de fechas.
            </span>
          </div>
        )}
      </div>

      {/* ── Métricas del Período (2 Tarjetas Claras de Negocio) ──────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MetricCard
          label="Facturado en el período"
          value={`$${periodInvoicesTotal.toLocaleString("es-AR", { minimumFractionDigits: 0 })}`}
          sub={`${approvedType11Invoices.length} factura${approvedType11Invoices.length !== 1 ? "s" : ""}`}
          icon={Receipt}
          color="accent"
        />
        <MetricCard
          label="Pendiente de facturar"
          value={`$${unbilledTotal.toLocaleString("es-AR", { minimumFractionDigits: 0 })}`}
          sub={`${unbilledAppointments.length} turno${unbilledAppointments.length !== 1 ? "s" : ""} sin factura`}
          icon={Clock}
          color={unbilledAppointments.length > 0 ? "yellow" : "green"}
        />
      </div>

      {/* ── Tabla de Comprobantes Emitidos ──────────────────────────── */}
      <section className="bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-[var(--foreground)]">Historial de facturas</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Comprobantes registrados en ARCA para el período seleccionado
            </p>
          </div>
          <div className="flex items-center gap-2">
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

        {/* Panel de filtros colapsable */}
        {filtersOpen && (
          <div className="grid grid-cols-2 md:grid-cols-2 gap-3 mb-4 p-3 bg-[var(--foreground)]/3 rounded-xl border border-[var(--foreground)]/10 text-sm animate-in fade-in">
            <div>
              <label className="block text-xs text-[var(--foreground)]/50 mb-1">Estado</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border rounded-lg px-2 py-1.5 text-xs bg-transparent border-[var(--foreground)]/15"
              >
                <option value="">Todos</option>
                <option value="approved">Aprobado</option>
                <option value="rejected">Rechazado</option>
                <option value="error">Sin respuesta</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[var(--foreground)]/50 mb-1">Origen</label>
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="w-full border rounded-lg px-2 py-1.5 text-xs bg-transparent border-[var(--foreground)]/15"
              >
                <option value="">Todos</option>
                <option value="appointment">Turnos</option>
                <option value="sale">Ventas</option>
                <option value="manual">Manual</option>
              </select>
            </div>
            {hasActiveFilters && (
              <div className="col-span-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setFilterStatus("");
                    setFilterSource("");
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
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        )}

        {!loadingInvoices && invoices.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">
            {hasActiveFilters
              ? "No hay comprobantes con los filtros seleccionados."
              : "No hay comprobantes registrados en este período."}
          </p>
        )}

        {invoices.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs md:text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-left text-[var(--foreground)]/50 text-[11px] tracking-wider">
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
                  <InvoiceRow
                    key={inv.id}
                    inv={inv}
                    onVerified={loadInvoices}
                    onViewReceipt={(id) => {
                      setSelectedInvoiceId(id);
                      setViewMode("receipt");
                    }}
                    onVoid={(item) => {
                      setVoidingInvoice(item);
                      setViewMode("void");
                    }}
                  />
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
    </div>
  );
}
