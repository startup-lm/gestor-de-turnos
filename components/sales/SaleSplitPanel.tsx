"use client";

import { useEffect, useState, useMemo } from "react";
import { useFetchOnce } from "@/lib/hooks/useFetchOnce";
import { Product } from "@/lib/types/Product";
import { getProducts } from "@/lib/repository/products";
import BarberSelector from "../turnos/BarberSelector";
import { Barber } from "@/lib/types/Barbers";
import { getBarbers } from "@/lib/repository/barbers";
import { DetailFormSkeleton } from "../loading/Skeleton";
import { createSale } from "@/lib/repository/sales";
import { emitArcaInvoice, getArcaStatus } from "@/lib/repository/arca";
import { ArcaStatus, ArcaDocType } from "@/lib/types/Arca";
import { useBusinessContext } from "@/lib/context/BusinessContext";
import { DEFAULT_PAYMENT_METHODS } from "@/lib/flags";
import { useAuth } from "@/lib/auth/AuthContext";
import { toast } from "@/lib/store/useToastStore";
import {
  ShoppingBag,
  FileText,
  Plus,
  Minus,
  ArrowLeft,
  Loader2,
} from "lucide-react";

const DOC_TYPES: { value: ArcaDocType; label: string }[] = [
  { value: 99, label: "Consumidor final" },
  { value: 96, label: "DNI" },
  { value: 80, label: "CUIT" },
  { value: 86, label: "CUIL" },
];

interface Props {
  onClose: () => void;
  onSaleCreated?: () => void;
}

export default function SaleSplitPanel({
  onClose,
  onSaleCreated,
}: Readonly<Props>) {
  const { isEnabled, businessSettings } = useBusinessContext();
  const ARCA_ENABLED = isEnabled("arca");
  const paymentMethods = useMemo(
    () =>
      businessSettings?.payment_methods?.length
        ? businessSettings.payment_methods
        : DEFAULT_PAYMENT_METHODS,
    [businessSettings?.payment_methods]
  );
  const { data, loading: loadingProducts } = useFetchOnce<Product[]>("products", getProducts);
  const { data: barbers = [], loading: loadingBarbers } = useFetchOnce<Barber[]>("barbers", getBarbers);
  const { data: arcaStatus } = useFetchOnce<ArcaStatus>("arcaStatus", getArcaStatus);

  const [selectedBarberId, setSelectedBarberId] = useState(-1);

  // Un barbero solo registra ventas a su nombre: el selector le muestra solo a él
  const { role, barberId } = useAuth();
  const isAdmin = role === "admin";
  const selectableBarbers = useMemo(
    () => (isAdmin ? barbers ?? [] : (barbers ?? []).filter((b) => b.id === barberId)),
    [isAdmin, barbers, barberId]
  );
  useEffect(() => {
    if (!isAdmin && barberId > 0) setSelectedBarberId(barberId);
  }, [isAdmin, barberId]);
  const products = useMemo<Product[]>(() => data ?? [], [data]);
  const [selectedProductId, setSelectedProductId] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [price, setPrice] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<string>(
    () => paymentMethods[0] || "Efectivo"
  );
  const [details, setDetails] = useState("");

  useEffect(() => {
    if (paymentMethods.length > 0 && !paymentMethods.includes(paymentMethod)) {
      setPaymentMethod(paymentMethods[0]);
    }
  }, [paymentMethods, paymentMethod]);

  // ARCA
  const arcaAvailable = ARCA_ENABLED && !!arcaStatus?.ready;
  const [emitInvoice, setEmitInvoice] = useState(false);
  const [docType, setDocType] = useState<ArcaDocType>(99);
  const [docNumber, setDocNumber] = useState("");

  useEffect(() => {
    if (selectedProductId === -1) {
      setPrice(0);
    } else {
      const prod = products.find((p) => p.id === selectedProductId);
      setPrice(prod?.price ?? 0);
    }
  }, [selectedProductId, products]);

  useEffect(() => {
    if (docType === 99) setDocNumber("");
  }, [docType]);

  const total = price * quantity;
  const isDisabled = selectedProductId < 0 || quantity <= 0 || loading;

  const handleRegisterSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDisabled) return;
    setLoading(true);

    const sale = {
      barber_id: selectedBarberId,
      product_id: selectedProductId,
      price,
      quantity,
      details,
      total,
      payment_method: paymentMethod,
    };

    try {
      const createResult = await createSale(sale);

      if (!createResult.success) {
        toast.error("Error al registrar venta de producto");
        setLoading(false);
        return;
      }

      if (emitInvoice && arcaAvailable) {
        const arcaResult = await emitArcaInvoice({
          total,
          docType,
          docNumber: docNumber.trim() || undefined,
          sourceType: "sale",
          sourceId: createResult.id,
        });

        if (arcaResult.success) {
          toast.success(`Venta registrada · Factura C emitida (CAE: ${arcaResult.cae})`);
        } else {
          toast.success("Venta registrada · Aviso: no se emitió comprobante");
        }
      } else {
        toast.success("Venta registrada con éxito");
      }

      onSaleCreated?.();
      onClose();
    } catch (err) {
      console.error("Error registrando venta:", err);
      toast.error("Error inesperado al registrar venta");
    } finally {
      setLoading(false);
    }
  };

  if (loadingProducts || loadingBarbers) {
    return <DetailFormSkeleton />;
  }

  return (
    <div className="w-full space-y-6 animate-fadeIn">
      {/* Cabecera con botón Volver y Botón de Acción a la derecha */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-5">
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent)] hover:text-white transition-colors cursor-pointer group mb-1"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Volver a ventas</span>
          </button>
          <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            Nueva venta
          </h2>
          <p className="text-xs text-slate-400">
            Registrá la salida y cobro de productos comercializados en el salón
          </p>
        </div>

        <button
          id="btn-sale-panel-submit"
          type="submit"
          form="sale-form"
          disabled={isDisabled}
          className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all shadow-md active:scale-95 min-h-[40px] ${
            !isDisabled
              ? "!bg-[var(--accent)] hover:opacity-90 !text-slate-950 shadow-[var(--accent)]/20 cursor-pointer"
              : "!bg-white/5 !text-slate-500 border border-white/10 cursor-not-allowed opacity-50"
          }`}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-inherit" />
          ) : (
            <>
              <ShoppingBag className="w-4 h-4" />
              <span>Registrar venta</span>
            </>
          )}
        </button>
      </div>

      {/* Formulario Inline en Pantalla Completa */}
      <form id="sale-form" onSubmit={handleRegisterSale} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna Izquierda: Datos de la Venta */}
          <div className="lg:col-span-7 bg-gradient-to-b from-[var(--foreground)]/5 to-[var(--foreground)]/2 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-lg space-y-5">
            <div className="flex items-center gap-2 text-[var(--accent)] text-sm font-bold uppercase tracking-wider border-b border-white/10 pb-3">
              <ShoppingBag className="w-4 h-4" />
              <span>Detalle de la venta</span>
            </div>

            {/* Selector de Producto */}
            <div>
              <label htmlFor="sale-panel-product" className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                Producto *
              </label>
              <select
                id="sale-panel-product"
                required
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(Number(e.target.value))}
                className="w-full !bg-[var(--background)] !text-[var(--foreground)] !border !border-[var(--foreground)]/15 focus:!border-[var(--accent)] rounded-xl p-3 text-sm transition-all outline-none"
              >
                <option value={-1} disabled style={{ color: "black" }}>
                  Seleccioná un producto del catálogo
                </option>
                {products.map((p) => (
                  <option key={p.id} value={p.id} style={{ color: "black" }}>
                    {p.name} — ${p.price?.toLocaleString("es-AR") ?? 0}
                  </option>
                ))}
              </select>
            </div>

            {/* Selector de Barbero */}
            <div>
              <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                Barbero / vendedor
              </label>
              <BarberSelector
                id="sale-panel-barber"
                barbers={selectableBarbers}
                selectedBarberId={selectedBarberId}
                onChange={setSelectedBarberId}
                className="w-full"
              />
            </div>

            {/* Fila: Precio y Cantidad */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="sale-panel-price" className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                  Precio unitario ($)
                </label>
                <input
                  id="sale-panel-price"
                  type="number"
                  min={0}
                  required
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full !bg-[var(--background)] !text-[var(--foreground)] !border !border-[var(--foreground)]/15 focus:!border-[var(--accent)] rounded-xl p-3 text-sm font-semibold transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                  Cantidad
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-3 rounded-xl !bg-[var(--foreground)]/10 hover:!bg-[var(--foreground)]/20 !text-[var(--foreground)] transition-all cursor-pointer border border-[var(--foreground)]/10 active:scale-95"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    className="flex-1 text-center font-bold !bg-[var(--background)] !text-[var(--foreground)] !border !border-[var(--foreground)]/15 focus:!border-[var(--accent)] rounded-xl p-3 text-sm transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="p-3 rounded-xl !bg-[var(--foreground)]/10 hover:!bg-[var(--foreground)]/20 !text-[var(--foreground)] transition-all cursor-pointer border border-[var(--foreground)]/10 active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Selector de Medio de Pago */}
            <div>
              <label className="block text-xs font-semibold text-[var(--accent)] tracking-wider mb-1.5">
                Medio de pago
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {paymentMethods.map((m) => {
                  const isSelected = paymentMethod === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer min-h-[44px] sm:min-h-0 flex items-center justify-center text-center ${
                        isSelected
                          ? "!bg-[var(--accent)] !text-slate-950 !border-[var(--accent)] font-bold shadow-sm"
                          : "!bg-[var(--background)] !text-[var(--foreground)] !border-[var(--foreground)]/15 hover:!bg-white/5"
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Observaciones */}
            <div>
              <label htmlFor="sale-panel-details" className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                Observaciones (opcional)
              </label>
              <textarea
                id="sale-panel-details"
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Ej: Cliente habitual, pago combinado..."
                className="w-full !bg-[var(--background)] !text-[var(--foreground)] !border !border-[var(--foreground)]/15 focus:!border-[var(--accent)] rounded-xl p-3 text-sm transition-all outline-none resize-none"
              />
            </div>
          </div>

          {/* Columna Derecha: Total a Cobrar y Facturación ARCA */}
          <div className="lg:col-span-5 space-y-6">
            {/* Tarjeta Destacada de Total */}
            <div className="bg-gradient-to-b from-[var(--accent)]/15 to-[var(--accent)]/5 border border-[var(--accent)]/30 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-[var(--accent)] uppercase tracking-wider block mb-1">
                  Total a cobrar
                </span>
                <p className="text-xs text-slate-400">
                  {quantity} {quantity === 1 ? "unidad" : "unidades"} a ${price.toLocaleString("es-AR")} c/u
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-[var(--accent)]/20 flex items-baseline justify-between">
                <span className="text-xs text-slate-400 font-medium">Monto final:</span>
                <span className="text-3xl font-black text-[var(--accent)] tracking-tight">
                  ${total.toLocaleString("es-AR")}
                </span>
              </div>
            </div>

            {/* Sección ARCA */}
            {arcaAvailable && (
              <div className="bg-gradient-to-b from-[var(--foreground)]/5 to-[var(--foreground)]/2 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-200">
                      Emitir comprobante ARCA
                    </span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={emitInvoice}
                    onClick={() => setEmitInvoice((v) => !v)}
                    className={`w-10 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-200 ${
                      emitInvoice ? "bg-[var(--accent)]" : "bg-slate-700"
                    }`}
                  >
                    <div
                      className={`bg-slate-950 w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                        emitInvoice ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {emitInvoice && (
                  <div className="space-y-4 pt-3 border-t border-white/10 animate-fadeIn">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                        Tipo de documento
                      </label>
                      <select
                        value={docType}
                        onChange={(e) => setDocType(Number(e.target.value) as ArcaDocType)}
                        className="w-full !bg-[var(--background)] !text-[var(--foreground)] !border !border-[var(--foreground)]/15 focus:!border-[var(--accent)] rounded-xl p-2.5 text-xs outline-none"
                      >
                        {DOC_TYPES.map((dt) => (
                          <option key={dt.value} value={dt.value} style={{ color: "black" }}>
                            {dt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {docType !== 99 && (
                      <div>
                        <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                          Número de documento
                        </label>
                        <input
                          type="text"
                          required
                          value={docNumber}
                          onChange={(e) => setDocNumber(e.target.value)}
                          placeholder="Sin puntos ni guiones"
                          className="w-full !bg-[var(--background)] !text-[var(--foreground)] !border !border-[var(--foreground)]/15 focus:!border-[var(--accent)] rounded-xl p-2.5 text-xs outline-none"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
