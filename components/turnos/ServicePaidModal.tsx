"use client";

import { useEffect, useState } from "react";
import { updateAppointment } from "@/lib/repository/appointments";
import { useFetchOnce } from "@/lib/hooks/useFetchOnce";
import { getServices } from "@/lib/repository/services";
import { Service } from "@/lib/types/Services";
import Modal from "@/components/ui/Modal";
import PopupModal from "@/components/ui/PopupModal";
import { usePopup } from "@/lib/hooks/usePopup";
import PayButton from "../buttons/PayButton";

export default function ServicePaidModal({ appointment, onClose, setIsPaid, }: Readonly<{ appointment: { id: number }; onClose: () => void; setIsPaid: (paid: boolean) => void; }>) {
  const { data } = useFetchOnce<Service[]>(getServices);
  const services: Service[] = data ?? [];
  const [selectedServiceId, setSelectedServiceId] = useState(-1);
  const isDisabled = selectedServiceId < 0;
  const [loading, setLoading] = useState(false);
  const popup = usePopup();
  const [price, setPrice] = useState(0);

  useEffect(() => {
    if (selectedServiceId === -1) {
      setPrice(0);
    } else {
      const svc = services.find(s => s.id === selectedServiceId);
      setPrice(svc?.price ?? 0);
    }
  }, [selectedServiceId, services]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = await updateAppointment(appointment.id, { paid: true, price: price} );
    if (success) setIsPaid(true);
    popup.open(success ? "Turno marcado como pago" : "Error al marcar como pagado", success);
    setLoading(false);
  };

  return (
    <>
      <Modal onClose={onClose}>
        <h2 className="text-xl font-bold mb-4 text-center">Registrar pago</h2>
        <form onSubmit={handlePay} className="space-y-4 px-8">
          <div className="my-5 text-left rounded-2lg">
            <label className="block text-sm font-medium mb-1 mt-4">
              Servicio
            </label>
            <select required className="border p-2 rounded w-full bg-[var(--background)] text-[var(--foreground)]" value={selectedServiceId} onChange={e => setSelectedServiceId(Number(e.target.value))} >
              <option value={-1} disabled style={{ color: "grey" }}>
                Selecciona un servicio
              </option>
              {services.map(s => (
                <option key={s.id} value={s.id} style={{ color: "black" }}>
                  {s.name}
                </option>
              ))}
            </select>

            <label className="block text-sm font-medium mb-1 mt-4">
              Precio
            </label>
            <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} required className="mb-4" min={0}/>
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
