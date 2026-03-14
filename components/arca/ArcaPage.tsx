"use client";

import { useEffect, useMemo, useState } from "react";
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
  ArcaEnvironment,
  ArcaInvoiceRecord,
  ArcaStatus,
} from "@/lib/types/Arca";

const ENV_LABELS: Record<ArcaEnvironment, string> = {
  mock: "Demo",
  homo: "Homologación",
  prod: "Producción",
};

export default function ArcaPage() {
  const popup = usePopup();
  const { data: config, loading: loadingConfig, refetch: refetchConfig } = useFetchOnce<ArcaConfig>(getArcaConfig);
  const { data: status, loading: loadingStatus, refetch: refetchStatus } = useFetchOnce<ArcaStatus>(getArcaStatus);
  const { data: invoices, loading: loadingInvoices, refetch: refetchInvoices } = useFetchOnce<ArcaInvoiceRecord[]>(getArcaInvoices);

  const [environment, setEnvironment] = useState<ArcaEnvironment>("mock");
  const [cuit, setCuit] = useState("");
  const [pointOfSale, setPointOfSale] = useState("");
  const [wsaaUrl, setWsaaUrl] = useState("");
  const [wsfeUrl, setWsfeUrl] = useState("");
  const [certPem, setCertPem] = useState("");
  const [keyPem, setKeyPem] = useState("");
  const [keyPassphrase, setKeyPassphrase] = useState("");
  const [savingConfig, setSavingConfig] = useState(false);

  const [emitTotal, setEmitTotal] = useState("");
  const [emitCustomerName, setEmitCustomerName] = useState("");
  const [emitting, setEmitting] = useState(false);

  useEffect(() => {
    if (!config) return;
    setEnvironment(config.environment ?? "mock");
    setCuit(config.cuit ?? "");
    setPointOfSale(config.point_of_sale ? String(config.point_of_sale) : "");
    setWsaaUrl(config.wsaa_url ?? "");
    setWsfeUrl(config.wsfe_url ?? "");
  }, [config]);

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
      });
      if (!result.success) {
        popup.open(result.error ?? "No se pudo emitir", false);
      } else {
        popup.open("Comprobante emitido", true);
        setEmitTotal("");
        setEmitCustomerName("");
        await refetchInvoices();
      }
    } catch (err) {
      console.error(err);
      popup.open("Error al emitir comprobante", false);
    } finally {
      setEmitting(false);
    }
  };

  const isLoading = loadingConfig || loadingStatus;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <h1 className="text-2xl md:text-3xl font-bold text-center">Facturación</h1>

      {isLoading && (
        <div className="flex justify-center">
          <Spinner />
        </div>
      )}

      <section className="bg-[var(--bg-carousel)] p-4 rounded-lg shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <h2 className="text-lg font-semibold">Configuración ARCA</h2>
          {status && (
            <span className={`text-xs px-2 py-1 rounded-full ${status.ready ? "bg-green-500/20 text-green-300" : "bg-yellow-500/20 text-yellow-300"}`}>
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
                  {config.has_cert ? "Certificado cargado" : "Sin certificado"}
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
                  {config.has_key ? "Clave cargada" : "Sin clave"}
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

      <section className="bg-[var(--bg-carousel)] p-4 rounded-lg shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <h2 className="text-lg font-semibold">Emitir comprobante</h2>
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
          <div className="md:col-span-2">
            <label className="block font-medium mb-1">Cliente (opcional)</label>
            <input
              value={emitCustomerName}
              onChange={(e) => setEmitCustomerName(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Consumidor final"
            />
          </div>

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

      <section className="bg-[var(--bg-carousel)] p-4 rounded-lg shadow-xl">
        <h2 className="text-lg font-semibold mb-4">Comprobantes emitidos</h2>

        {loadingInvoices && (
          <div className="flex justify-center">
            <Spinner />
          </div>
        )}

        {!loadingInvoices && (!invoices || invoices.length === 0) && (
          <p className="text-sm text-gray-400 text-center">No hay comprobantes registrados.</p>
        )}

        {invoices && invoices.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs md:text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-left">
                  <th className="py-2 pr-3">Fecha</th>
                  <th className="py-2 pr-3">Estado</th>
                  <th className="py-2 pr-3">Total</th>
                  <th className="py-2 pr-3">CAE</th>
                  <th className="py-2 pr-3">Nro</th>
                  <th className="py-2 pr-3">PV</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-800">
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {inv.created_at ? new Date(inv.created_at).toLocaleDateString() : "-"}
                    </td>
                    <td className="py-2 pr-3">{inv.status}</td>
                    <td className="py-2 pr-3">${Number(inv.total).toFixed(2)}</td>
                    <td className="py-2 pr-3">{inv.cae ?? "-"}</td>
                    <td className="py-2 pr-3">{inv.voucher_number ?? "-"}</td>
                    <td className="py-2 pr-3">{inv.point_of_sale ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

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
