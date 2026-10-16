"use client";

import React, { useEffect, useState } from "react";
import { getSalesPage, updateSale, deleteSale } from "@/lib/repository/sales";
import Spinner from "@/components/loading/Spinner";
import EditButton from "@/components/buttons/EditButton";
import DeleteButton from "@/components/buttons/DeleteButton";
import SaveButton from "@/components/buttons/SaveButton";
import CancelButton from "@/components/buttons/CancelButton";
import { SaleWithRelations } from "@/lib/types/Sale";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { usePopup } from "@/lib/hooks/usePopup";
import { Receipt } from "lucide-react";
import { useBusinessContext } from "@/lib/context/BusinessContext";

const PAGE_SIZE = 10;

type EditState = {
  price: string;
  quantity: string;
  total: string;
  details: string;
};

export default function SalesTable() {
  const { isEnabled } = useBusinessContext();
  const ARCA_ENABLED = isEnabled("arca");
  const [sales, setSales] = useState<SaleWithRelations[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [confirmModal, setConfirmModal] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const popup = usePopup();
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const loadPage = async (pageToLoad: number) => {
    setLoading(true);
    const result = await getSalesPage(pageToLoad, PAGE_SIZE);
    setSales(result.data);
    setTotal(result.total);
    setLoading(false);
  };

  useEffect(() => {
    void loadPage(page);
  }, [page]);

  const handlePrev = () => {
    setPage((p) => Math.max(1, p - 1));
  };

  const handleNext = () => {
    setPage((p) => Math.min(totalPages, p + 1));
  };

  const handleEditClick = (sale: SaleWithRelations) => {
    if (sale.id == null) return;
    setEditingId(sale.id);
    setEdit({
      price: sale.price.toString(),
      quantity: sale.quantity.toString(),
      total: sale.total.toString(),
      details: sale.details ?? "",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEdit(null);
  };

  const handleChange = (field: keyof EditState, value: string) => {
    if (!edit) return;
    setEdit({ ...edit, [field]: value });
  };

  const handleSave = async (id: number) => {
    if (!edit) return;
    setSavingId(id);
    const priceNumber = edit.price ? Number(edit.price) : 0;
    const quantityNumber = edit.quantity ? Number(edit.quantity) : 0;
    const totalNumber = priceNumber * quantityNumber;
    const payload = {
      price: priceNumber,
      quantity: quantityNumber,
      total: totalNumber,
      details: edit.details,
    };
    const ok = await updateSale(id, payload);
    setSavingId(null);
    if (!ok) {
      alert("No se pudo guardar la venta");
      return;
    }

    await loadPage(page);
    setEditingId(null);
    setEdit(null);
  };

  const openDeleteConfirm = (id: number) => {
    setSelectedSaleId(id);
    setConfirmModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedSaleId == null) return;
    setDeleteLoading(true);
    const ok = await deleteSale(selectedSaleId);
    setDeleteLoading(false);
    popup.open( ok ? "Venta eliminada con éxito" : "Error al eliminar la venta", ok );
    if (ok) { await loadPage(page); }
    setConfirmModal(false);
    setSelectedSaleId(null);
  };

  const handleDeleteCancel = () => {
    popup.close();
    setConfirmModal(false);
    setSelectedSaleId(null);
  };

  return (
    <div className="bg-[var(--bg-carousel)] p-4 rounded-lg shadow-xl">
      {loading && (
        <div className="flex justify-center mb-3">
          <Spinner />
        </div>
      )}

      {!loading && sales.length === 0 && (
        <p className="text-sm text-gray-400 text-center">
          No hay ventas registradas.
        </p>
      )}

      {sales.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs md:text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-left">
                  <th className="py-2 pr-3">Fecha</th>
                  <th className="py-2 pr-3">Barbero</th>
                  <th className="py-2 pr-3">Producto</th>
                  <th className="py-2 pr-3">Precio</th>
                  <th className="py-2 pr-3">Cant.</th>
                  <th className="py-2 pr-3">Total</th>
                  <th className="py-2 pr-3">Detalles</th>
                  {ARCA_ENABLED && <th className="py-2 pr-3">Factura</th>}
                  <th className="py-2 pr-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => {
                  const isEditing = editingId === sale.id;

                  const dateLabel = sale.created_at
                    ? (() => {
                        const d = new Date(sale.created_at);
                        const day = String(d.getDate()).padStart(2, "0");
                        const month = String(d.getMonth() + 1).padStart(2, "0");
                        const year = d.getFullYear();
                        return `${day}-${month}-${year}`;
                      })()
                    : "-";

                  const barberName = sale.barbers?.name ?? "-";
                  const productName = sale.products?.name ?? "-";

                  return (
                    <tr
                      key={sale.id}
                      className={`border-b border-gray-800 align-middle ${
                        isEditing ? "bg-white/5" : ""
                      }`}
                    >
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {dateLabel}
                      </td>

                      <td className="py-2 pr-3 whitespace-nowrap">
                        {barberName}
                      </td>

                      <td className="py-2 pr-3 whitespace-nowrap">
                        {productName}
                      </td>

                      <td className="py-2 pr-3">
                        {isEditing ? (
                          <input
                            type="number"
                            className="!w-20 rounded bg-gray-900 border border-gray-700 !px-3 text-xs"
                            value={edit?.price ?? ""}
                            onChange={(e) =>
                              handleChange("price", e.target.value)
                            }
                          />
                        ) : (
                          <>${sale.price.toLocaleString("es-AR")}</>
                        )}
                      </td>

                      <td className="py-2 pr-3">
                        {isEditing ? (
                          <input
                            type="number"
                            className="!w-14 rounded bg-gray-900 border border-gray-700 !px-3 text-xs"
                            value={edit?.quantity ?? ""}
                            onChange={(e) =>
                              handleChange("quantity", e.target.value)
                            }
                          />
                        ) : (
                          sale.quantity
                        )}
                      </td>

                      <td className="py-2 pr-3">
                        {isEditing && edit ? (
                          (() => {
                            const priceNumber = edit.price
                              ? Number(edit.price)
                              : 0;
                            const quantityNumber = edit.quantity
                              ? Number(edit.quantity)
                              : 0;
                            const totalNumber =
                              priceNumber * quantityNumber;

                            return <>${totalNumber.toLocaleString("es-AR")}</>;
                          })()
                        ) : (
                          <>${sale.total.toLocaleString("es-AR")}</>
                        )}
                      </td>

                      <td className="py-2 pr-3">
                        {isEditing ? (
                          <input
                            type="text"
                            className="w-40 rounded bg-gray-900 border border-gray-700 px-1 py-0.5 text-xs"
                            value={edit?.details ?? ""}
                            onChange={(e) =>
                              handleChange("details", e.target.value)
                            }
                          />
                        ) : (
                          sale.details ?? "-"
                        )}
                      </td>

                      {ARCA_ENABLED && (
                        <td className="py-2 pr-3">
                          {sale.arca_invoice_id ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-medium whitespace-nowrap">
                              <Receipt className="w-3 h-3" />
                              Emitida
                            </span>
                          ) : (
                            <span className="text-[var(--foreground)]/30 text-xs">—</span>
                          )}
                        </td>
                      )}

                      <td className="py-2 pr-3 text-right whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex justify-end gap-2">
                            <SaveButton
                              onClick={() =>
                                sale.id != null && handleSave(sale.id)
                              }
                              disabled={savingId === sale.id}
                              hideLabel
                              className="w-7 h-7 !p-0"
                            />
                            <CancelButton
                              onClick={handleCancelEdit}
                              disabled={savingId === sale.id}
                              hideLabel
                              className="w-7 h-7 !p-0"
                            />
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1">
                            <EditButton
                              onClick={() => handleEditClick(sale)}
                              hideLabel
                              className="w-7 h-7 !p-0"
                            />
                            <DeleteButton
                              onClick={() =>
                                sale.id != null && openDeleteConfirm(sale.id)
                              }
                              hideLabel
                              className="w-7 h-7 !p-0"
                            />
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4 text-xs md:text-sm">
            <span className="text-gray-400">
              Página {page} de {totalPages} — Total: {total} ventas
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePrev}
                disabled={page <= 1}
                className="px-2 py-1 rounded border border-gray-600 disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={page >= totalPages}
                className="px-2 py-1 rounded border border-gray-600 disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        </>
      )}

      {confirmModal && (
        <ConfirmModal
          title="¿Estás seguro que querés eliminar esta venta?"
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          loading={deleteLoading}
          button="delete"
        />
      )}
    </div>
  );
}
