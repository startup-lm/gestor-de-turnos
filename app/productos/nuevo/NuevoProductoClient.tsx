"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, DollarSign, Package, Upload, AlertCircle, Loader2, Plus } from "lucide-react";
import { createProduct } from "@/lib/repository/products";
import { uploadImage } from "@/lib/repository/storage";
import { useAuth } from "@/lib/auth/AuthContext";
import { toast } from "@/lib/store/useToastStore";

export default function NuevoProductoClient() {
  const router = useRouter();
  const { role } = useAuth();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("10");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre del producto es obligatorio.");
      return;
    }
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setError("Ingresá un precio válido.");
      return;
    }
    const numStock = Number(stock);
    if (isNaN(numStock) || numStock < 0) {
      setError("Ingresá un stock válido.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let imageUrl = "";
      if (imageFile) {
        try {
          imageUrl = await uploadImage("products", imageFile);
        } catch (imgErr) {
          console.error("Error subiendo imagen:", imgErr);
          toast.info("No se pudo subir la imagen, el producto se creará sin imagen.");
        }
      }

      const success = await createProduct({
        name: name.trim(),
        description: description.trim(),
        price: numPrice,
        stock: numStock,
        image: imageUrl,
      });

      if (success) {
        toast.success("Producto creado con éxito");
        router.push("/productos");
        router.refresh();
      } else {
        setError("Ocurrió un error al guardar el producto.");
        toast.error("Error al crear el producto");
      }
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error inesperado.");
      toast.error("Error inesperado al guardar");
    } finally {
      setLoading(false);
    }
  };

  if (role === "guest") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-[var(--accent)] mb-4" />
        <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">Acceso restringido</h2>
        <p className="text-sm text-[var(--foreground)]/60 mb-6 max-w-md">
          Esta sección es exclusiva para administradores de la barbería.
        </p>
        <Link
          href="/productos"
          className="px-6 py-2.5 rounded-xl bg-[var(--accent)] text-black font-semibold hover:opacity-90 transition-opacity"
        >
          Volver a Productos
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1720px] mx-auto px-4 md:px-8 py-8 md:py-12">
      {/* Navigation & Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/productos"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent)] hover:underline mb-2 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Volver a productos
          </Link>
          <h1 className="text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
            Nuevo producto
          </h1>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            form="new-product-form"
            disabled={loading}
            className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all shadow-md active:scale-95 min-h-[40px] ${
              !loading
                ? "!bg-[var(--accent)] hover:!bg-[var(--accent-hover)] !text-slate-950 shadow-[var(--accent)]/20 cursor-pointer"
                : "!bg-[var(--foreground)]/5 !text-[var(--foreground)]/30 border border-[var(--foreground)]/10 cursor-not-allowed opacity-50"
            }`}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-inherit" />
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Crear producto</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form Layout */}
      <form id="new-product-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Column: Image Upload & Preview */}
        <div className="lg:col-span-5 flex flex-col h-full">
          <div className="p-6 rounded-2xl border border-[var(--foreground)]/10 bg-gradient-to-b from-[var(--foreground)]/5 to-[var(--foreground)]/2 backdrop-blur-md flex flex-col justify-between h-full">
            <div className="flex flex-col flex-1 min-h-0 mb-4">
              <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-3">
                Foto del Producto
              </label>

              <div className="relative w-full h-[320px] lg:h-auto lg:flex-1 min-h-[240px] rounded-2xl overflow-hidden border-2 border-dashed border-[var(--foreground)]/15 hover:border-[var(--accent)]/50 transition-colors bg-[var(--background)]/50 flex flex-col items-center justify-center group cursor-pointer">
                {imagePreview ? (
                  <>
                    <Image
                      src={imagePreview}
                      alt="Vista previa"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
                      <Upload className="w-8 h-8 text-[var(--accent)] mb-2" />
                      <span className="text-xs font-semibold text-white">Hacé clic para cambiar la foto</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)] mb-3 group-hover:scale-110 transition-transform">
                      <Upload className="w-7 h-7" />
                    </div>
                    <span className="text-sm font-semibold text-[var(--foreground)]">Seleccionar foto</span>
                    <span className="text-xs text-[var(--foreground)]/40 mt-1">PNG, JPG o WEBP (máx. 4MB)</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>
            <p className="text-[11px] text-[var(--foreground)]/40 text-center flex-shrink-0">
              Recomendado: Fondo neutro o transparente con proporción 1:1.
            </p>
          </div>
        </div>

        {/* Right Column: Fields */}
        <div className="lg:col-span-7 flex flex-col h-full">
          <div className="p-6 md:p-8 rounded-2xl border border-[var(--foreground)]/10 bg-gradient-to-b from-[var(--foreground)]/5 to-[var(--foreground)]/2 backdrop-blur-md flex flex-col justify-between h-full space-y-6">
            <div className="space-y-6 flex-1">
              {/* Name */}
              <div>
                <label htmlFor="product-name" className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-2">
                  Nombre del Producto <span className="text-red-500">*</span>
                </label>
                <input
                  id="product-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Cera Fijadora Mate 100ml"
                  required
                  className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-xl p-3.5 w-full block text-sm"
                />
              </div>

              {/* Price & Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="product-price" className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-2">
                    Precio de Venta ($) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-[var(--foreground)]/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="product-price"
                      type="number"
                      min="0"
                      step="100"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="8500"
                      required
                      className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-xl !py-3.5 !pr-4 !pl-11 w-full block text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="product-stock" className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-2">
                    Stock Inicial <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Package className="w-4 h-4 text-[var(--foreground)]/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="product-stock"
                      type="number"
                      min="0"
                      step="1"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      required
                      className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-xl !py-3.5 !pr-4 !pl-11 w-full block text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="product-description" className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-2">
                  Descripción del Producto <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="product-description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detallá tipo de fijación, fragancia, modo de uso y volumen..."
                  required
                  className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-xl p-3.5 w-full block text-sm resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
