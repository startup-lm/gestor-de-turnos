"use client";

import { useState } from "react";
import { ArrowLeft, DollarSign, Package, Save, Plus, Trash2, Loader2 } from "lucide-react";
import { Product } from "@/lib/types/Product";
import { createProduct, updateProduct, deleteProduct } from "@/lib/repository/products";
import { uploadImage, deleteImage } from "@/lib/repository/storage";
import { toast } from "@/lib/store/useToastStore";
import InlineConfirm from "@/components/ui/InlineConfirm";
import CatalogImageField from "./CatalogImageField";
import { catalogInputClass, catalogLabelClass } from "./styles";

interface Props {
  /** Sin producto es un alta; con producto, una edición */
  product?: Product;
  onBack: () => void;
  onSaved: () => void;
}

export default function ProductForm({ product, onBack, onSaved }: Readonly<Props>) {
  const isEditing = Boolean(product);

  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [stock, setStock] = useState(String(product?.stock ?? 0));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const isDirty =
    !product ||
    name !== product.name ||
    description !== product.description ||
    Number(price) !== product.price ||
    Number(stock) !== (product.stock ?? 0) ||
    imageFile !== null;

  const handleImageSelect = (file: File) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("El nombre del producto es obligatorio");
      return;
    }
    const numPrice = Number(price);
    if (price === "" || isNaN(numPrice) || numPrice < 0) {
      toast.error("Ingresá un precio válido");
      return;
    }
    const numStock = Number(stock);
    if (!Number.isInteger(numStock) || numStock < 0) {
      toast.error("Ingresá un stock válido");
      return;
    }

    setSaving(true);
    try {
      let imageUrl = product?.image ?? "";
      if (imageFile) {
        try {
          if (product?.image) await deleteImage("products", product.image).catch(() => undefined);
          imageUrl = await uploadImage("products", imageFile);
        } catch {
          toast.info("No se pudo subir la imagen, el producto se guarda sin cambiarla");
        }
      }

      const fields = {
        name: name.trim(),
        description: description.trim(),
        price: numPrice,
        stock: numStock,
        image: imageUrl,
      };
      const success = product ? await updateProduct({ id: product.id, ...fields }) : await createProduct(fields);

      if (success) {
        toast.success(isEditing ? "Producto actualizado con éxito" : "Producto creado con éxito");
        onSaved();
      } else {
        toast.error(isEditing ? "Error al actualizar el producto" : "Error al crear el producto");
      }
    } catch {
      toast.error("Error inesperado al guardar el producto");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    setDeleting(true);
    try {
      const success = await deleteProduct(product.id);
      if (success) {
        toast.success("Producto eliminado con éxito");
        onSaved();
      } else {
        toast.error("Error al eliminar el producto");
        setIsConfirmingDelete(false);
      }
    } catch {
      toast.error("Error inesperado al eliminar el producto");
      setIsConfirmingDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-[var(--accent)] hover:text-white transition-colors cursor-pointer group mb-1"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Volver a productos</span>
          </button>
          <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
            {isEditing ? "Editar producto" : "Nuevo producto"}
          </h2>
        </div>

        <div className="flex flex-col gap-3 self-start sm:self-auto w-full sm:w-auto">
          <div className="flex items-center gap-3">
            {isEditing && (
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                disabled={deleting || saving}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 border border-red-500/20 text-xs md:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 min-h-[44px]"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar</span>
              </button>
            )}
            <button
              type="submit"
              form="product-form"
              disabled={!isDirty || saving}
              className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all shadow-md active:scale-95 min-h-[44px] ${
                isDirty && !saving
                  ? "!bg-[var(--accent)] hover:!bg-[var(--accent-hover)] !text-slate-950 shadow-[var(--accent)]/20 cursor-pointer"
                  : "!bg-[var(--foreground)]/5 !text-[var(--foreground)]/30 border border-[var(--foreground)]/10 cursor-not-allowed opacity-50"
              }`}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isEditing ? (
                <Save className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>{isEditing ? "Guardar cambios" : "Crear producto"}</span>
            </button>
          </div>

          {isConfirmingDelete && (
            <InlineConfirm
              message="¿Eliminar el producto? Se borra del catálogo y no se puede deshacer."
              confirmText="Eliminar"
              cancelText="Cancelar"
              onConfirm={handleDelete}
              onCancel={() => setIsConfirmingDelete(false)}
              loading={deleting}
            />
          )}
        </div>
      </div>

      <form id="product-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-5">
          <CatalogImageField
            label="Foto del producto"
            currentImage={product?.image}
            preview={imagePreview}
            fileName={imageFile?.name}
            onSelect={handleImageSelect}
          />
        </div>

        <div className="lg:col-span-7 p-6 md:p-8 rounded-2xl border border-[var(--foreground)]/10 bg-gradient-to-b from-[var(--foreground)]/5 to-[var(--foreground)]/2 backdrop-blur-md space-y-6">
          <div>
            <label htmlFor="product-name" className={catalogLabelClass}>
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              id="product-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Cera fijadora mate 100ml"
              required
              className={`${catalogInputClass} p-3.5`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="product-price" className={catalogLabelClass}>
                Precio de venta ($) <span className="text-red-500">*</span>
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
                  className={`${catalogInputClass} !py-3.5 !pr-4 !pl-11`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="product-stock" className={catalogLabelClass}>
                Stock disponible <span className="text-red-500">*</span>
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
                  className={`${catalogInputClass} !py-3.5 !pr-4 !pl-11`}
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="product-description" className={catalogLabelClass}>
              Descripción <span className="text-red-500">*</span>
            </label>
            <textarea
              id="product-description"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detallá tipo de fijación, fragancia, modo de uso y volumen"
              required
              className={`${catalogInputClass} p-3.5 resize-none`}
            />
          </div>
        </div>
      </form>
    </div>
  );
}
