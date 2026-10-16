"use client";

import { useEffect, useMemo, useState } from "react";
import { updateAppointment } from "@/lib/repository/appointments";
import { emitArcaInvoice } from "@/lib/repository/arca";
import { useFetchOnce } from "@/lib/hooks/useFetchOnce";
import { getServices } from "@/lib/repository/services";
import { getArcaStatus } from "@/lib/repository/arca";
import { Service } from "@/lib/types/Services";
import { ArcaStatus, ArcaDocType } from "@/lib/types/Arca";
import Modal from "@/components/ui/Modal";
import PopupModal from "@/components/ui/PopupModal";
import { usePopup } from "@/lib/hooks/usePopup";
import PayButton from "../buttons/PayButton";
import { Appointment } from "@/lib/types/Appointment";
import { FileText } from "lucide-react";
import { useBusinessContext } from "@/lib/context/BusinessContext";

const DOC_TYPES: { value: ArcaDocType; label: string }[] = [
  { value: 99, label: "Consumidor Final" },
  { value: 96, label: "DNI" },
  { value: 80, label: "CUIT" },
  { value: 86, label: "CUIL" },
];

export default function ServicePaidModal({
  appointment,
  onClose,
  setIsPaid,
}: Readonly<{
  appointment: Appointment;
  onClose: () => void;
  setIsPaid: (paid: boolean) => void;
}>) {
  const { isEnabled } = useBusinessContext();
  const ARCA_ENABLED = isEnabled("arca");
  const { data } = useFetchOnce<Service[]>("services", getServices);
  const { data: arcaStatus } = useFetchOnce<ArcaStatus>("arcaStatus", getArcaStatus);
  const services: Service[] = useMemo(() => data ?? [], [data]);

  const [selectedServiceId, setSelectedServiceId] = useState(appointment.service_id ?? -1);
  const isDisabled = selectedServiceId < 0;
  const [loading, setLoading] = useState(false);
  const popup = usePopup();
  const [price, setPrice] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Efectivo");

  // ARCA
  const arcaAvailable = ARCA_ENABLED && !!arcaStatus?.ready;
  const [emitInvoice, setEmitInvoice] = useState(false);
  const [docType, setDocType] = useState<ArcaDocType>(99);
  const [docNumber, setDocNumber] = useState("");

  useEffect(() => {
    if (selectedServiceId === -1) {
      setPrice(0);
    } else {
      const svc = services.find(s => s.id === selectedServiceId);
      setPrice(svc?.price ?? 0);
    }
  }, [selectedServiceId, services]);

  // Resetear docNumber al cambiar a Consumidor Final
  useEffect(() => {
    if (docType === 99) setDocNumber("");
  }, [docType]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const success = await updateAppointment(appointment.id, {
      paid: true,
      price,
      payment_method: paymentMethod,
    });

    if (!success) {
      popup.open("Error al marcar como pagado", false);
      setLoading(false);
      return;
    }

    setIsPaid(true);

    // Emitir comprobante ARCA si el toggle está activado
    if (emitInvoice && arcaAvailable) {
      const result = await emitArcaInvoice({
        total: price,
        customerName: appointment.client || undefined,
        docType,
        docNumber: docNumber.trim() || undefined,
        sourceType: "appointment",
        sourceId: appointment.id,
      });

      if (result.success) {
        popup.open(
          `Turno marcado como pago · Comprobante emitido (CAE: ${result.cae})`,
          true
        );
      } else {
        // El pago fue exitoso pero ARCA falló — avisamos sin bloquear
        popup.open(
          `Turno marcado como pago · No se pudo emitir comprobante: ${result.error ?? "error desconocido"}`,
          true
        );
      }
    } else {
      popup.open("Turno marcado como pago", true);
    }

    setLoading(false);
  };

  return (
    <>
      <Modal onClose={onClose} size="md">
        <h2 className="text-2xl font-bold mb-6 text-center text-[var(--foreground)]">
          Registrar pago
        </h2>
        <form onSubmit={handlePay} className="px-2 text-left space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                Servicio
              </label>
              <select
                id="paid-service"
                required
                className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-lg p-2.5 w-full block text-sm h-[42px]"
                value={selectedServiceId}
                onChange={e => setSelectedServiceId(Number(e.target.value))}
              >
                <option value={-1} disabled style={{ color: "grey" }}>
                  Selecciona un servicio
                </option>
                {services.map(s => (
                  <option key={s.id} value={s.id} style={{ color: "black" }}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                  Precio Cobrado ($)
                </label>
                <input
                  id="paid-price"
                  type="number"
                  value={price}
                  onChange={e => setPrice(Number(e.target.value))}
                  required
                  className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-lg p-2.5 w-full block text-sm"
                  min={0}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                  Método de Pago
                </label>
                <select
                  id="paid-payment-method"
                  required
                  className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-lg p-2.5 w-full block text-sm h-[42px]"
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                >
                  <option value="Efectivo" style={{ color: "black" }}>Efectivo</option>
                  <option value="MercadoPago" style={{ color: "black" }}>Mercado Pago</option>
                </select>
              </div>
            </div>

            <div className="bg-[var(--foreground)]/5 border border-[var(--accent)]/20 rounded-xl p-4 flex justify-between items-center mt-2 shadow-inner">
              <div>
                <span className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider">Total Cobrado</span>
                <span className="text-[10px] text-[var(--foreground)]/40 uppercase tracking-widest">Monto registrado</span>
              </div>
              <span className="text-3xl font-extrabold text-[var(--accent)]">
                ${price}
              </span>
            </div>

            {/* Toggle ARCA — solo visible si ARCA está habilitado y listo */}
            {arcaAvailable && (
              <div className="border border-slate-700/60 rounded-xl overflow-hidden bg-slate-900/60">
                <button
                  type="button"
                  onClick={() => setEmitInvoice(v => !v)}
                  className={`!w-full !flex !items-center !justify-between !px-4 !py-3 !text-sm !transition-all !border-0 !rounded-none !cursor-pointer !transform-none ${
                    emitInvoice
                      ? "!bg-emerald-950/50 !border-b !border-emerald-500/30"
                      : "!bg-slate-900/70 hover:!bg-slate-800/90"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FileText
                      className={`w-4 h-4 transition-colors ${emitInvoice ? "text-emerald-400" : "text-slate-400"}`}
                    />
                    <span className={`text-sm font-medium transition-colors ${emitInvoice ? "text-emerald-300" : "text-slate-200"}`}>
                      Emitir comprobante ARCA
                    </span>
                  </div>
                  {/* Toggle visual */}
                  <div
                    className={`relative w-11 h-6 rounded-full transition-colors flex items-center p-0.5 ${
                      emitInvoice ? "!bg-emerald-500" : "!bg-slate-700"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                        emitInvoice ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </div>
                </button>

                {emitInvoice && (
                  <div className="px-4 py-3 space-y-3 bg-emerald-950/30 border-t border-emerald-500/20">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1">
                        Tipo de documento
                      </label>
                      <select
                        id="arca-doc-type"
                        value={docType}
                        onChange={e => setDocType(Number(e.target.value) as ArcaDocType)}
                        className="!bg-slate-900/90 !text-white !border !border-slate-700/80 focus:!border-[var(--accent)]/50 transition-all rounded-lg p-2 w-full block text-sm h-[38px]"
                      >
                        {DOC_TYPES.map(d => (
                          <option key={d.value} value={d.value} style={{ color: "black" }}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {docType !== 99 && (
                      <div>
                        <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1">
                          Número de documento
                        </label>
                        <input
                          id="arca-doc-number"
                          type="text"
                          value={docNumber}
                          onChange={e => setDocNumber(e.target.value)}
                          placeholder={docType === 80 ? "20-XXXXXXXX-X" : "XX.XXX.XXX"}
                          className="!bg-slate-900/90 !text-white !border !border-slate-700/80 focus:!border-[var(--accent)]/50 transition-all rounded-lg p-2 w-full block text-sm"
                        />
                      </div>
                    )}

                    <p className="text-[10px] text-slate-400">
                      Se emitirá Factura C por ${price} — Modo Demo (CAE de prueba)
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-center pt-4">
            <PayButton id="btn-paid-submit" type="submit" disabled={isDisabled} loading={loading} />
          </div>
        </form>
      </Modal>

      {popup.show && (
        <PopupModal
          message={popup.message}
          success={popup.success}
          onClose={() => {
            popup.close();
            if (popup.success) onClose();
          }}
        />
      )}
    </>
  );
}
