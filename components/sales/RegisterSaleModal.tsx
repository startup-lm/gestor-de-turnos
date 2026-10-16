"use client";

import { useEffect, useState, useMemo } from "react";
import { useFetchOnce } from "@/lib/hooks/useFetchOnce";
import Modal from "@/components/ui/Modal";
import PopupModal from "@/components/ui/PopupModal";
import { usePopup } from "@/lib/hooks/usePopup";
import PayButton from "../buttons/PayButton";
import { Product } from "@/lib/types/Product";
import { getProducts } from "@/lib/repository/products";
import BarberSelector from "../turnos/BarberSelector";
import { Barber } from "@/lib/types/Barbers";
import { getBarbers } from "@/lib/repository/barbers";
import Spinner from "../loading/Spinner";
import { createSale } from "@/lib/repository/sales";
import { emitArcaInvoice } from "@/lib/repository/arca";
import { getArcaStatus } from "@/lib/repository/arca";
import { ArcaStatus, ArcaDocType } from "@/lib/types/Arca";
import { FileText } from "lucide-react";

const ARCA_ENABLED = process.env.NEXT_PUBLIC_ENABLE_ARCA === "true";

const DOC_TYPES: { value: ArcaDocType; label: string }[] = [
  { value: 99, label: "Consumidor Final" },
  { value: 96, label: "DNI" },
  { value: 80, label: "CUIT" },
  { value: 86, label: "CUIL" },
];

export default function RegisterSaleModal({ onClose }: Readonly<{ onClose: () => void; }>) {
  const { data } = useFetchOnce<Product[]>("products", getProducts);
  const { data: barbers = [], loading: loadingFetch } = useFetchOnce<Barber[]>("barbers", getBarbers);
  const { data: arcaStatus } = useFetchOnce<ArcaStatus>("arcaStatus", getArcaStatus);

  const [selectedBarberId, setSelectedBarberId] = useState(-1);
  const products = useMemo<Product[]>(() => data ?? [], [data]);
  const [selectedProductId, setSelectedProductId] = useState(-1);
  const isDisabled = selectedProductId < 0;
  const [loading, setLoading] = useState(false);
  const [price, setPrice] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [details, setDetailes] = useState("");
  const popup = usePopup();

  // ARCA
  const arcaAvailable = ARCA_ENABLED && !!arcaStatus?.ready;
  const [emitInvoice, setEmitInvoice] = useState(false);
  const [docType, setDocType] = useState<ArcaDocType>(99);
  const [docNumber, setDocNumber] = useState("");

  useEffect(() => {
    if (selectedProductId === -1) setPrice(0);
    else {
      const svc = products.find(p => p.id === selectedProductId);
      setPrice(svc?.price ?? 0);
    }
  }, [selectedProductId, products]);

  useEffect(() => {
    if (docType === 99) setDocNumber("");
  }, [docType]);

  const handleRegisterSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const sale = {
      barber_id: selectedBarberId,
      product_id: selectedProductId,
      price,
      quantity,
      details,
      total: price * quantity,
    };

    const createResult = await createSale(sale);

    if (!createResult.success) {
      popup.open("Error al registrar venta de producto", false);
      setLoading(false);
      return;
    }

    // Emitir comprobante ARCA si el toggle está activado
    if (emitInvoice && arcaAvailable) {
      const arcaResult = await emitArcaInvoice({
        total: price * quantity,
        docType,
        docNumber: docNumber.trim() || undefined,
        sourceType: "sale",
        sourceId: createResult.id, // ID real de la venta recién creada
      });

      if (arcaResult.success) {
        popup.open(
          `Venta registrada · Comprobante emitido (CAE: ${arcaResult.cae})`,
          true
        );
      } else {
        popup.open(
          `Venta registrada · No se pudo emitir comprobante: ${arcaResult.error ?? "error desconocido"}`,
          true
        );
      }
    } else {
      popup.open("Venta de producto registrada con éxito.", true);
    }

    setLoading(false);
  };

  if (loadingFetch) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-50">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <Modal onClose={onClose} size="lg">
        <h2 className="text-2xl font-bold mb-6 text-center text-[var(--foreground)]">Registrar venta</h2>
        <form onSubmit={handleRegisterSale} className="space-y-6 px-2 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                Barbero
              </label>
              <BarberSelector
                id="sale-barber"
                barbers={barbers ?? []}
                selectedBarberId={selectedBarberId}
                onChange={setSelectedBarberId}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                Producto
              </label>
              <select
                id="sale-product"
                required
                className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-lg p-2.5 w-full block text-sm h-[42px]"
                value={selectedProductId}
                onChange={e => setSelectedProductId(Number(e.target.value))}
              >
                <option value={-1} disabled style={{ color: "grey" }}>
                  Selecciona un producto
                </option>
                {products.map(p => (
                  <option key={p.id} value={p.id} style={{ color: "black" }}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                Precio
              </label>
              <input
                id="sale-price"
                type="number"
                value={price}
                onChange={e => setPrice(Number(e.target.value))}
                required
                min={0}
                className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-lg p-2.5 w-full block text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                Cantidad
              </label>
              <input
                id="sale-quantity"
                type="number"
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
                required
                min={0}
                className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-lg p-2.5 w-full block text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                Observaciones
              </label>
              <input
                id="sale-details"
                value={details}
                onChange={(e) => setDetailes(e.target.value)}
                className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-lg p-2.5 w-full block text-sm"
                placeholder="Detalles adicionales de la venta..."
              />
            </div>

            <div className="md:col-span-2 bg-[var(--foreground)]/5 border border-[var(--accent)]/20 rounded-xl p-4 flex justify-between items-center mt-2 shadow-inner">
              <div>
                <span className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider">Total a Cobrar</span>
                <span className="text-[10px] text-[var(--foreground)]/40 uppercase tracking-widest">Suma total calculada</span>
              </div>
              <span className="text-3xl font-extrabold text-[var(--accent)]">
                ${price * quantity}
              </span>
            </div>

            {/* Toggle ARCA — solo visible si ARCA está habilitado y listo */}
            {arcaAvailable && (
              <div className="md:col-span-2 border border-[var(--foreground)]/10 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setEmitInvoice(v => !v)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${
                    emitInvoice
                      ? "bg-green-500/10 border-b border-green-500/20"
                      : "bg-[var(--foreground)]/3 hover:bg-[var(--foreground)]/6"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText
                      className={`w-4 h-4 ${emitInvoice ? "text-green-400" : "text-[var(--foreground)]/50"}`}
                    />
                    <span className={`font-medium ${emitInvoice ? "text-green-300" : "text-[var(--foreground)]/70"}`}>
                      Emitir comprobante ARCA
                    </span>
                  </div>
                  <div
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      emitInvoice ? "bg-green-500" : "bg-[var(--foreground)]/20"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        emitInvoice ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </div>
                </button>

                {emitInvoice && (
                  <div className="px-4 py-3 space-y-3 bg-green-500/5">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1">
                        Tipo de documento
                      </label>
                      <select
                        id="arca-doc-type-sale"
                        value={docType}
                        onChange={e => setDocType(Number(e.target.value) as ArcaDocType)}
                        className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 transition-all rounded-lg p-2 w-full block text-sm h-[38px]"
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
                          id="arca-doc-number-sale"
                          type="text"
                          value={docNumber}
                          onChange={e => setDocNumber(e.target.value)}
                          placeholder={docType === 80 ? "20-XXXXXXXX-X" : "XX.XXX.XXX"}
                          className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 transition-all rounded-lg p-2 w-full block text-sm"
                        />
                      </div>
                    )}

                    <p className="text-[10px] text-[var(--foreground)]/40">
                      Se emitirá Factura C por ${price * quantity} — Modo Demo (CAE de prueba)
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-center pt-4">
            <PayButton id="btn-sale-submit" type="submit" disabled={isDisabled} loading={loading} />
          </div>
        </form>
      </Modal>

      {popup.show && (
        <PopupModal message={popup.message} success={popup.success}
          onClose={() => {
            popup.close();
            if (popup.success) onClose();
          }}
        />
      )}
    </>
  );
}