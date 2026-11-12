"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArcaSkeleton } from "@/components/loading/Skeleton";
import { toast } from "@/lib/store/useToastStore";
import { useFetchOnce } from "@/lib/hooks/useFetchOnce";
import {
  emitArcaInvoice,
  emitCreditNote,
  getArcaConfig,
  getArcaInvoices,
  getArcaStatus,
} from "@/lib/repository/arca";
import type {
  ArcaConfig,
  ArcaDocType,
  ArcaInvoiceRecord,
  ArcaStatus,
} from "@/lib/types/Arca";
import InvoiceReceipt from "@/components/arca/InvoiceReceipt";
import { CONSUMIDOR_FINAL } from "@/lib/arca/receiverConditions";
import { Appointment } from "@/lib/types/Appointment";
import { type ArcaPeriod } from "./facturas/constants";
import { formatDateISO } from "./facturas/utils";
import { VoidInvoiceView } from "./facturas/VoidInvoiceView";
import { EmitInvoiceView } from "./facturas/EmitInvoiceView";
import { InvoiceListView } from "./facturas/InvoiceListView";

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
        onBack={() => { setSelectedInvoiceId(null); setViewMode("list"); }}
      />
    );
  }

  // ── MODO 4: ANULAR CON NOTA DE CRÉDITO (CONFIRMACIÓN EN PANTALLA) ─────────
  if (viewMode === "void" && voidingInvoice) {
    return (
      <VoidInvoiceView
        voidingInvoice={voidingInvoice}
        voidingLoading={voidingLoading}
        onBack={() => { setVoidingInvoice(null); setViewMode("list"); }}
        onConfirmVoid={handleConfirmVoid}
      />
    );
  }

  // ── MODO 2: EMITIR FACTURA (PANEL DE ACCIÓN) ──────────────────────────────
  if (viewMode === "emit") {
    return (
      <EmitInvoiceView
        isHomo={isHomo}
        certExpiryNotice={certExpiryNotice}
        status={status}
        periodPreset={periodPreset}
        setPeriodPreset={setPeriodPreset}
        customStart={customStart}
        setCustomStart={setCustomStart}
        customEnd={customEnd}
        setCustomEnd={setCustomEnd}
        daysCount={daysCount}
        isPeriodValid={isPeriodValid}
        unbilledAppointments={unbilledAppointments}
        unbilledTotal={unbilledTotal}
        batchBilling={batchBilling}
        confirmBatch={confirmBatch}
        setConfirmBatch={setConfirmBatch}
        onBatchInvoice={handleBatchInvoice}
        emitTotal={emitTotal}
        setEmitTotal={setEmitTotal}
        emitCustomerName={emitCustomerName}
        setEmitCustomerName={setEmitCustomerName}
        emitDocType={emitDocType}
        setEmitDocType={setEmitDocType}
        emitDocNumber={emitDocNumber}
        setEmitDocNumber={setEmitDocNumber}
        emitReceiverCondition={emitReceiverCondition}
        setEmitReceiverCondition={setEmitReceiverCondition}
        emitting={emitting}
        onEmit={handleEmit}
        onBack={() => setViewMode("list")}
      />
    );
  }

  // ── MODO 1: LISTADO DE COMPROBANTES (VISTA PRINCIPAL POR DEFECTO) ────────
  return (
    <InvoiceListView
      isHomo={isHomo}
      certExpiryNotice={certExpiryNotice}
      status={status}
      onEmitClick={() => setViewMode("emit")}
      periodPreset={periodPreset}
      setPeriodPreset={setPeriodPreset}
      customStart={customStart}
      setCustomStart={setCustomStart}
      customEnd={customEnd}
      setCustomEnd={setCustomEnd}
      daysCount={daysCount}
      isPeriodValid={isPeriodValid}
      periodInvoicesTotal={periodInvoicesTotal}
      approvedType11InvoicesCount={approvedType11Invoices.length}
      unbilledTotal={unbilledTotal}
      unbilledAppointmentsCount={unbilledAppointments.length}
      invoices={invoices}
      loadingInvoices={loadingInvoices}
      filterStatus={filterStatus}
      setFilterStatus={setFilterStatus}
      filterSource={filterSource}
      setFilterSource={setFilterSource}
      filtersOpen={filtersOpen}
      setFiltersOpen={setFiltersOpen}
      onVerified={loadInvoices}
      onViewReceipt={(id) => { setSelectedInvoiceId(id); setViewMode("receipt"); }}
      onVoid={(item) => { setVoidingInvoice(item); setViewMode("void"); }}
    />
  );
}
