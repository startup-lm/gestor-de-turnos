"use client";

import { useEffect, useMemo, useState } from "react";
import { updateAppointment } from "@/lib/repository/appointments";
import { useFetchOnce } from "@/lib/hooks/useFetchOnce";
import { getServices } from "@/lib/repository/services";
import { Service } from "@/lib/types/Services";
import Modal from "@/components/ui/Modal";
import PopupModal from "@/components/ui/PopupModal";
import { usePopup } from "@/lib/hooks/usePopup";
import PayButton from "../buttons/PayButton";

export default function ServicePaidModal({ appointment, onClose, setIsPaid, }: Readonly<{ appointment: { id: number }; onClose: () => void; setIsPaid: (paid: boolean) => void; }>) {
  const { data } = useFetchOnce<Service[]>("services", getServices);
  const services: Service[] = useMemo(() => data ?? [], [data]);
  const [selectedServiceId, setSelectedServiceId] = useState(-1);
  const isDisabled = selectedServiceId < 0;
  const [loading, setLoading] = useState(false);
  const popup = usePopup();
  const [price, setPrice] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Efectivo");

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
    const success = await updateAppointment(appointment.id, { paid: true, price: price, payment_method: paymentMethod } );
    if (success) setIsPaid(true);
    popup.open(success ? "Turno marcado como pago" : "Error al marcar como pagado", success);
    setLoading(false);
  };

  return (
    <>
      <Modal onClose={onClose} size="md">
        <h2 className="text-2xl font-bold mb-6 text-center text-[var(--foreground)]">Registrar pago</h2>
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
          </div>

          <div className="flex justify-center pt-4">
            <PayButton id="btn-paid-submit" type="submit" disabled={isDisabled} loading={loading} />
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
