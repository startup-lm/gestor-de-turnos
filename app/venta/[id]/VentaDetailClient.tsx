"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useFetchOnce } from "@/lib/hooks/useFetchOnce";
import { Product } from "@/lib/types/Product";
import { getProducts } from "@/lib/repository/products";
import BarberSelector from "@/components/turnos/BarberSelector";
import { Barber } from "@/lib/types/Barbers";
import { getBarbers } from "@/lib/repository/barbers";
import { DetailFormSkeleton } from "@/components/loading/Skeleton";
import { updateSale, deleteSale } from "@/lib/repository/sales";
import { emitArcaInvoice, getArcaStatus } from "@/lib/repository/arca";
import { ArcaStatus, ArcaDocType } from "@/lib/types/Arca";
import ArcaDocFields from "@/components/arca/ArcaDocFields";
import { useBusinessContext } from "@/lib/context/BusinessContext";
import { useAuth } from "@/lib/auth/AuthContext";
import { toast } from "@/lib/store/useToastStore";
import InlineConfirm from "@/components/ui/InlineConfirm";
import { SaleWithRelations } from "@/lib/types/Sale";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import {
  ShoppingBag,
  FileText,
  Plus,
  Minus,
  ArrowLeft,
  Save,
  Trash2,
  Loader2,
  Receipt,
  Calendar,
  AlertTriangle,
  Copy,
  Check,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";

interface Props {
  initialSale: SaleWithRelations;
}

export default function VentaDetailClient({ initialSale }: Readonly<Props>) {
  const router = useRouter();
  const { isEnabled } = useBusinessContext();
  const ARCA_ENABLED = isEnabled("arca");
  const controlsStock = isEnabled("stock_control");

  const { data: productsData, loading: loadingProducts, refetch: refetchProducts } = useFetchOnce<Product[]>(
    "products",
    getProducts
  );
  const { data: barbers = [], loading: loadingBarbers } = useFetchOnce<Barber[]>(
    "barbers",
    getBarbers
  );
  const { data: arcaStatus } = useFetchOnce<ArcaStatus>("arcaStatus", getArcaStatus);

  const products = useMemo<Product[]>(() => productsData ?? [], [productsData]);

  // Un barbero no puede pasarle la venta a otro: el selector le muestra solo a él
  const { role, barberId } = useAuth();
  const isAdmin = role === "admin";
  const selectableBarbers = useMemo(() => {
    const active = (barbers ?? []).filter((b) => b.active !== false);
    return isAdmin ? active : active.filter((b) => b.id === barberId);
  }, [isAdmin, barbers, barberId]);

  // Form states initialized with initialSale
  const [selectedProductId, setSelectedProductId] = useState<number>(initialSale.product_id);
  const [selectedBarberId, setSelectedBarberId] = useState<number>(initialSale.barber_id);
  const [price, setPrice] = useState<number>(initialSale.price);
  const [quantity, setQuantity] = useState<number>(initialSale.quantity);
  const [details, setDetails] = useState<string>(initialSale.details ?? "");

  // Actions states
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // ARCA
  const arcaAvailable = ARCA_ENABLED && !!arcaStatus?.ready;
  const hasExistingInvoice = !!initialSale.arca_invoice_id;
  const isLocked = hasExistingInvoice;
  const invoice = initialSale.arca_invoices;
  const [copiedCae, setCopiedCae] = useState(false);

  const handleCopyCae = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCae(true);
    toast.success("CAE copiado al portapapeles");
    setTimeout(() => setCopiedCae(false), 2000);
  };

  const [emitInvoice, setEmitInvoice] = useState(false);
  const [docType, setDocType] = useState<ArcaDocType>(99);
  const [docNumber, setDocNumber] = useState("");

  const total = price * quantity;

  // Las unidades de esta venta ya salieron del stock: si sigue siendo el mismo producto, cuentan como disponibles
  const productStock = products.find((p) => p.id === selectedProductId)?.stock ?? 0;
  const available = productStock + (selectedProductId === initialSale.product_id ? initialSale.quantity : 0);
  const maxQuantity = controlsStock ? available : Infinity;

  // Check if form is dirty
  const isDirty =
    selectedProductId !== initialSale.product_id ||
    selectedBarberId !== initialSale.barber_id ||
    price !== initialSale.price ||
    quantity !== initialSale.quantity ||
    details.trim() !== (initialSale.details ?? "").trim() ||
    emitInvoice;

  const handleProductChange = (newProductId: number) => {
    setSelectedProductId(newProductId);
    const prod = products.find((p) => p.id === newProductId);
    if (prod) {
      setPrice(prod.price);
      if (controlsStock) {
        const max = (prod.stock ?? 0) + (newProductId === initialSale.product_id ? initialSale.quantity : 0);
        setQuantity((q) => Math.max(1, Math.min(q, max)));
      }
    }
  };

  const handleBack = () => {
    router.push("/admin?tab=ventas");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0 || price < 0 || selectedProductId <= 0) {
      toast.error("Por favor completa los campos obligatorios");
      return;
    }

    if (!initialSale.id) return;
    if (isLocked) {
      toast.error("No es posible editar una venta que ya posee comprobante fiscal emitido");
      return;
    }

    setSaving(true);
    try {
      const res = await updateSale(initialSale.id, {
        barber_id: selectedBarberId,
        product_id: selectedProductId,
        price,
        quantity,
        total,
        details: details.trim(),
      });

      if (!res.success) {
        toast.error(res.error || "No se pudo guardar la venta");
        if (controlsStock) refetchProducts();
        setSaving(false);
        return;
      }
      if (controlsStock) refetchProducts();

      // If user requested to emit an invoice and none existed
      if (emitInvoice && arcaAvailable && !hasExistingInvoice) {
        const arcaResult = await emitArcaInvoice({
          total,
          docType,
          docNumber: docNumber.trim() || undefined,
          sourceType: "sale",
          sourceId: initialSale.id,
        });

        if (arcaResult.success) {
          toast.success(`Venta actualizada · Factura C emitida (CAE: ${arcaResult.cae})`);
        } else {
          toast.success("Venta actualizada · Aviso: no se emitió comprobante fiscal");
        }
      } else {
        toast.success("Venta actualizada con éxito");
      }

      handleBack();
    } catch (err) {
      console.error("Error al actualizar la venta:", err);
      toast.error("Error inesperado al guardar cambios");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initialSale.id) return;
    setDeleting(true);
    try {
      const ok = await deleteSale(initialSale.id);
      if (ok) {
        toast.success("Venta eliminada con éxito");
        handleBack();
      } else {
        toast.error("Error al eliminar la venta");
        setIsConfirmingDelete(false);
      }
    } catch (err) {
      console.error("Error al eliminar venta:", err);
      toast.error("Error inesperado al eliminar venta");
      setIsConfirmingDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  const formattedCreationDate = initialSale.created_at
    ? format(new Date(initialSale.created_at), "EEE d MMM yyyy, HH:mm'hs'", { locale: es })
    : null;

  if (loadingProducts || loadingBarbers) {
    return (
      <div className="w-full max-w-[1720px] mx-auto px-4 md:px-8 py-8 md:py-12">
        <DetailFormSkeleton />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1720px] mx-auto px-4 md:px-8 py-8 md:py-12 space-y-6 animate-in fade-in duration-300">
      {/* Cabecera con Volver y Botones de Acción */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-5">
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-[var(--accent)] hover:text-white transition-colors cursor-pointer group mb-1"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Volver a ventas</span>
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
              Editar venta
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Modificá los detalles de la venta registrada en el local
          </p>
        </div>

        {/* Acciones principales en cabecera */}
        <div className="flex flex-col gap-3 self-start sm:self-auto w-full sm:w-auto">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(true)}
              disabled={deleting || saving || hasExistingInvoice}
              title={
                hasExistingInvoice
                  ? "No se puede eliminar una venta con comprobante fiscal emitido ante ARCA"
                  : undefined
              }
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 border border-red-500/20 text-xs md:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              <span>Eliminar venta</span>
            </button>

            <button
              type="submit"
              form="sale-edit-form"
              disabled={!isDirty || saving || isLocked}
              title={
                isLocked
                  ? "No se puede editar una venta con comprobante fiscal emitido ante ARCA"
                  : undefined
              }
              className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all shadow-md active:scale-95 min-h-[40px] ${
                isDirty && !saving && !isLocked
                  ? "!bg-[var(--accent)] hover:!bg-[var(--accent-hover)] !text-slate-950 shadow-[var(--accent)]/20 cursor-pointer"
                  : "!bg-white/5 !text-slate-500 border border-white/10 cursor-not-allowed opacity-50"
              }`}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin text-inherit" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar cambios</span>
                </>
              )}
            </button>
          </div>

          {isConfirmingDelete && (
            <InlineConfirm
              message="¿Eliminar esta venta? Esta acción no se puede deshacer y ajustará los registros de caja del salón."
              confirmText="Eliminar"
              cancelText="Cancelar"
              onConfirm={handleDelete}
              onCancel={() => setIsConfirmingDelete(false)}
              loading={deleting}
            />
          )}
        </div>
      </div>

      {/* Formulario en 2 Columnas idéntico a SaleSplitPanel */}
      <form id="sale-edit-form" onSubmit={handleSave} className="space-y-6">
        {isLocked && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-sm animate-in fade-in">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-400" />
            <div>
              <span className="font-bold block">Venta bloqueada fiscalmente</span>
              <span className="text-xs text-amber-300/80">
                Esta venta cuenta con comprobante fiscal emitido ante ARCA (Factura #{initialSale.arca_invoice_id}) y no puede ser modificada ni eliminada.
              </span>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna Izquierda: Datos de la Venta */}
          <div className="lg:col-span-7 bg-gradient-to-b from-[var(--foreground)]/5 to-[var(--foreground)]/2 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-lg space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-[var(--accent)] text-sm font-bold uppercase tracking-wider">
                <ShoppingBag className="w-4 h-4" />
                <span>Detalle de la venta</span>
              </div>
              {formattedCreationDate && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 capitalize">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{formattedCreationDate}</span>
                </div>
              )}
            </div>

            {/* Selector de Producto */}
            <div>
              <label htmlFor="sale-edit-product" className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                Producto *
              </label>
              <select
                id="sale-edit-product"
                required
                disabled={isLocked}
                value={selectedProductId}
                onChange={(e) => handleProductChange(Number(e.target.value))}
                className={`w-full !bg-[var(--background)] !text-[var(--foreground)] !border !border-[var(--foreground)]/15 focus:!border-[var(--accent)] rounded-xl p-3 text-sm transition-all outline-none ${
                  isLocked ? "!opacity-60 !cursor-not-allowed" : ""
                }`}
              >
                <option value={-1} disabled style={{ color: "black" }}>
                  Seleccioná un producto del catálogo
                </option>
                {products.map((p) => {
                  const own = p.id === initialSale.product_id ? initialSale.quantity : 0;
                  const left = (p.stock ?? 0) + own;
                  const outOfStock = controlsStock && left <= 0;
                  return (
                    <option key={p.id} value={p.id} disabled={outOfStock} style={{ color: "black" }}>
                      {p.name} — ${p.price?.toLocaleString("es-AR") ?? 0}
                      {controlsStock && (outOfStock ? " · sin stock" : ` · quedan ${left}`)}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Selector de Barbero */}
            <div>
              <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                Barbero / vendedor
              </label>
              <BarberSelector
                id="sale-edit-barber"
                barbers={selectableBarbers}
                selectedBarberId={selectedBarberId}
                onChange={setSelectedBarberId}
                disabled={isLocked}
                className="w-full"
              />
            </div>

            {/* Fila: Precio y Cantidad */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="sale-edit-price" className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                  Precio unitario ($)
                </label>
                <input
                  id="sale-edit-price"
                  type="number"
                  min={0}
                  required
                  disabled={isLocked}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className={`w-full !bg-[var(--background)] !text-[var(--foreground)] !border !border-[var(--foreground)]/15 focus:!border-[var(--accent)] rounded-xl p-3 text-sm font-semibold transition-all outline-none ${
                    isLocked ? "!opacity-60 !cursor-not-allowed" : ""
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                  Cantidad
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className={`p-3 rounded-xl !bg-[var(--foreground)]/10 hover:!bg-[var(--foreground)]/20 !text-[var(--foreground)] transition-all border border-[var(--foreground)]/10 active:scale-95 ${
                      isLocked ? "!opacity-60 !cursor-not-allowed" : "cursor-pointer"
                    }`}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    disabled={isLocked}
                    value={quantity}
                    max={controlsStock ? Math.max(1, available) : undefined}
                    onChange={(e) => setQuantity(Math.min(maxQuantity, Math.max(1, Number(e.target.value))))}
                    className={`flex-1 text-center font-bold !bg-[var(--background)] !text-[var(--foreground)] !border !border-[var(--foreground)]/15 focus:!border-[var(--accent)] rounded-xl p-3 text-sm transition-all outline-none ${
                      isLocked ? "!opacity-60 !cursor-not-allowed" : ""
                    }`}
                  />
                  <button
                    type="button"
                    disabled={isLocked || quantity >= maxQuantity}
                    onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                    className={`p-3 rounded-xl !bg-[var(--foreground)]/10 hover:!bg-[var(--foreground)]/20 !text-[var(--foreground)] transition-all border border-[var(--foreground)]/10 active:scale-95 ${
                      isLocked || quantity >= maxQuantity ? "!opacity-60 !cursor-not-allowed" : "cursor-pointer"
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {controlsStock && !isLocked && (
                  <p className={`text-[11px] mt-1.5 ${available > 0 ? "text-slate-400" : "text-red-400"}`}>
                    {available > 0 ? `Quedan ${available}` : "Sin stock"}
                  </p>
                )}
              </div>
            </div>

            {/* Observaciones */}
            <div>
              <label htmlFor="sale-edit-details" className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                Observaciones (opcional)
              </label>
              <textarea
                id="sale-edit-details"
                rows={3}
                disabled={isLocked}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Ej: Cliente habitual, pago combinado..."
                className={`w-full !bg-[var(--background)] !text-[var(--foreground)] !border !border-[var(--foreground)]/15 focus:!border-[var(--accent)] rounded-xl p-3 text-sm transition-all outline-none resize-none ${
                  isLocked ? "!opacity-60 !cursor-not-allowed" : ""
                }`}
              />
            </div>
          </div>

          {/* Columna Derecha: Total a Cobrar y Facturación ARCA */}
          <div className="lg:col-span-5 space-y-6">
            {/* Tarjeta Destacada de Total */}
            <div className="bg-gradient-to-b from-[var(--accent)]/15 to-[var(--accent)]/5 border border-[var(--accent)]/30 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-[var(--accent)] uppercase tracking-wider block mb-1">
                  Total de la venta
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
            {ARCA_ENABLED && (
              <div className="bg-gradient-to-b from-[var(--foreground)]/5 to-[var(--foreground)]/2 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-lg space-y-4">
                {hasExistingInvoice ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-green-400" />
                        <span className="text-xs font-bold text-slate-200">
                          Comprobante Fiscal ARCA
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold">
                        {invoice?.voucher_type === 6 ? "Factura B" : "Factura C"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                          Nro. Comprobante
                        </span>
                        <span className="font-mono font-bold text-slate-200">
                          {invoice?.point_of_sale != null && invoice?.voucher_number != null
                            ? `${String(invoice.point_of_sale).padStart(4, "0")}-${String(invoice.voucher_number).padStart(8, "0")}`
                            : `#${initialSale.arca_invoice_id}`}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                          Estado fiscal
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          {invoice?.status === "mock" ? "Demo" : "Aprobado"}
                        </span>
                      </div>

                      <div className="col-span-2 bg-[var(--background)]/60 rounded-xl p-3 border border-white/5 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                            Código CAE
                          </span>
                          {invoice?.cae && (
                            <button
                              type="button"
                              onClick={() => handleCopyCae(invoice.cae!)}
                              className="text-[10px] font-semibold text-[var(--accent)] hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              {copiedCae ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400">Copiado</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copiar</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                        <p className="font-mono text-sm font-bold text-emerald-400">
                          {invoice?.cae || "—"}
                        </p>
                        {invoice?.cae_due_date && (
                          <span className="text-[10px] text-slate-500 block">
                            Vto: {invoice.cae_due_date}
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                          Receptor
                        </span>
                        <span className="font-medium text-slate-200 truncate block">
                          {invoice?.customer_name || "Consumidor Final"}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                          Documento
                        </span>
                        <span className="font-medium text-slate-200 truncate block">
                          {invoice?.doc_number ? `${invoice.doc_number}` : "Sin doc."}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        {invoice?.created_at
                          ? new Date(invoice.created_at).toLocaleDateString("es-AR")
                          : "Comprobante registrado"}
                      </span>
                      <Link
                        href="/admin?tab=facturas"
                        className="inline-flex items-center gap-1 text-xs font-bold text-[var(--accent)] hover:text-white transition-colors group cursor-pointer"
                      >
                        <span>Ver en Facturación</span>
                        <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                ) : arcaAvailable ? (
                  <>
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
                      <div className="space-y-4 pt-3 border-t border-white/10 animate-in fade-in duration-200">
                        <ArcaDocFields
                          idPrefix="venta-detail"
                          docType={docType}
                          onDocTypeChange={setDocType}
                          docNumber={docNumber}
                          onDocNumberChange={setDocNumber}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-slate-400">
                    Facturación ARCA actualmente no configurada o no disponible.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
