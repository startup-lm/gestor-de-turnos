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

export default function RegisterSaleModal({ onClose }: Readonly<{ onClose: () => void; }>) {
  const { data } = useFetchOnce<Product[]>(getProducts);
  const { data: barbers = [], loading: loadingFetch } = useFetchOnce<Barber[]>(getBarbers);
  const [selectedBarberId, setSelectedBarberId] = useState(-1);
  const products = useMemo<Product[]>(() => data ?? [], [data]);
  const [selectedProductId, setSelectedProductId] = useState(-1);
  const isDisabled = selectedProductId < 0;
  const [loading, setLoading] = useState(false);
  const [price, setPrice] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [details, setDetailes] = useState("");
  const popup = usePopup();

  useEffect(() => {
    if (selectedProductId === -1) setPrice(0);
    else {
      const svc = products.find(p => p.id === selectedProductId);
      setPrice(svc?.price ?? 0);
    }
  }, [selectedProductId, products]);

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
    const success = await createSale(sale);
    popup.open(
      success ? "Venta de producto registrada con éxito." : "Error al registrar venta de producto",
      success
    );
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
      <Modal onClose={onClose}>
        <h2 className="text-xl font-bold mb-4 text-center">Registrar venta</h2>
        <form onSubmit={handleRegisterSale} className="space-y-4 px-8">
          <div className="my-5 text-left rounded-2lg">
            <label className="block text-sm font-medium mb-1 mt-4">
              Barbero
            </label>
            <BarberSelector
              barbers={barbers ?? []}
              selectedBarberId={selectedBarberId}
              onChange={setSelectedBarberId}
              className="w-full"
            />

            <label className="block text-sm font-medium mb-1 mt-4">
              Producto
            </label>
            <select required className="border p-2 rounded w-full bg-[var(--background)] text-[var(--foreground)]" value={selectedProductId} onChange={e => setSelectedProductId(Number(e.target.value))} >
              <option value={-1} disabled style={{ color: "grey" }}>
                Selecciona un producto
              </option>
              {products.map(p => (
                <option key={p.id} value={p.id} style={{ color: "black" }}>
                  {p.name}
                </option>
              ))}
            </select>

            <label className="block text-sm font-medium mb-1 mt-4">
              Precio
            </label>
            <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} required min={0} />

            <label className="block text-sm font-medium mb-1 mt-4">
              Cantidad
            </label>
            <input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} required min={0} />

            <label className="block text-sm font-medium mb-1 mt-4">
              Observaciones
            </label>
            <input value={details} onChange={(e) => setDetailes(e.target.value)} />

            <label className="block text-sm font-medium mb-1 mt-4">
              Total a cobrar
            </label>
            <input type="number" value={price * quantity} readOnly />
          </div>
          <div className="flex justify-center mt-10">
            <PayButton type="submit" disabled={isDisabled} loading={loading} />
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