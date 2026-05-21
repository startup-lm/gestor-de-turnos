"use client";

import { useState, useEffect } from "react";
import { useFetchOnce } from "@/lib/hooks/useFetchOnce";
import { getBarbers, updateBarber } from "@/lib/repository/barbers";
import { Barber } from "@/lib/types/Barbers";
import BarberSelector from "@/components/turnos/BarberSelector";
import Modal from "@/components/ui/Modal";
import PopupModal from "@/components/ui/PopupModal";
import Spinner from "@/components/loading/Spinner";
import { usePopup } from "@/lib/hooks/usePopup";

import SaveButton from "../buttons/SaveButton";
import { deleteAuthUser } from "@/lib/repository/auth";

interface Props {
  barberId?: number;
  onClose: () => void;
}

export default function EditBarberModal({ barberId, onClose }: Readonly<Props>) {
  const { data: barbers = [], loading: fetchLoading } = useFetchOnce<Barber[]>("barbers", getBarbers);
  const [selectedBarberId, setSelectedBarberId] = useState<number>(barberId ?? -1);
  const [commission, setCommission] = useState<string>("");
  const [saleCommission, setSaleCommission] = useState<string>("");
  const [initialCommission, setInitialCommission] = useState<string>("");
  const [initialSaleCommission, setInitialSaleCommission] = useState<string>("");
  const [statusEnabled, setStatusEnabled] = useState<boolean>(true);
  const [initialStatus, setInitialStatus] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const popup = usePopup();
  const formDisabled = selectedBarberId < 0;

  const handleBarberChange = (id: number) => {
    setSelectedBarberId(id);
    if (!barbers) return;
    const found = barbers.find((b) => b.id === id);
    if (found) {
      const percent = ((found.commission ?? 0) * 100).toFixed(1);
      const salePercent = ((found.sale_commission ?? 0) * 100).toFixed(1);
      setCommission(percent);
      setSaleCommission(salePercent);
      setInitialCommission(percent);
      setInitialSaleCommission(salePercent);
      setStatusEnabled(Boolean(found.active));
      setInitialStatus(Boolean(found.active));
    } else {
      setCommission("");
      setSaleCommission("");
      setInitialCommission("");
      setInitialSaleCommission("");
      setStatusEnabled(true);
      setInitialStatus(true);
    }
  };

  useEffect(() => {
    if (barbers && barbers.length > 0 && selectedBarberId !== -1) {
      handleBarberChange(selectedBarberId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barbers, selectedBarberId]);

  const canSave = !formDisabled && (commission !== initialCommission || statusEnabled !== initialStatus || saleCommission !== initialSaleCommission);
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setLoading(true);
    const commissionFraction = parseFloat(commission) / 100;
    const saleCommissionFraction = parseFloat(saleCommission) / 100;
    const updated = await updateBarber(selectedBarberId, { commission: commissionFraction, active: statusEnabled, sale_commission: saleCommissionFraction });
    if (updated && initialStatus && !statusEnabled) {
      const barbero = barbers!.find((b) => b.id === selectedBarberId);
      if (barbero?.email) await deleteAuthUser(barbero.email);
    }
    popup.open(updated ? "Barbero editado exitosamente" : "Hubo un error al editar el barbero", updated);
    setLoading(false);
  };

  if (fetchLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-50">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <Modal onClose={onClose} size="md">
        <h2 className="text-2xl font-bold mb-6 text-center text-[var(--foreground)]">Editar Barbero</h2>
        <form onSubmit={handleSave} className="px-2 text-left">
          <div className="mt-2 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                Barbero
              </label>
              <BarberSelector
                id="edit-barber-selector"
                barbers={barbers ?? []}
                selectedBarberId={selectedBarberId}
                onChange={handleBarberChange}
                className="w-full"
              />
            </div>

            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${formDisabled ? "opacity-50 pointer-events-none" : ""}`}>
              <div>
                <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                  Ganancia por corte
                </label>
                <div className="relative w-full">
                  <input 
                    id="edit-barber-commission" 
                    type="number" 
                    min="0" 
                    max="100" 
                    step="0.1" 
                    value={commission}
                    onChange={(e) => setCommission(e.target.value)} 
                    disabled={formDisabled} 
                    className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-lg p-2.5 pr-10 w-full block text-sm" 
                  />
                  <span className="font-semibold absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--accent)] text-sm">%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
                  Ganancia por venta
                </label>
                <div className="relative w-full">
                  <input 
                    id="edit-barber-sale-commission" 
                    type="number" 
                    min="0" 
                    max="100" 
                    step="0.1" 
                    value={saleCommission}
                    onChange={(e) => setSaleCommission(e.target.value)} 
                    disabled={formDisabled} 
                    className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-lg p-2.5 pr-10 w-full block text-sm" 
                  />
                  <span className="font-semibold absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--accent)] text-sm">%</span>
                </div>
              </div>
            </div>

            <div className={formDisabled ? "opacity-50 pointer-events-none" : ""}>
              <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-2">
                Estado del Barbero
              </label>
              <div className="flex bg-[var(--foreground)]/5 p-1 rounded-xl border border-[var(--foreground)]/10">
                <button
                  type="button"
                  onClick={() => setStatusEnabled(true)}
                  disabled={formDisabled}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                    statusEnabled 
                      ? "bg-[var(--accent)] text-black shadow-md" 
                      : "text-[var(--foreground)]/40 hover:text-[var(--foreground)]"
                  }`}
                >
                  Habilitado
                </button>
                <button
                  type="button"
                  onClick={() => setStatusEnabled(false)}
                  disabled={formDisabled}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                    !statusEnabled 
                      ? "bg-red-500/20 border border-red-500/40 text-red-400 shadow-md" 
                      : "text-[var(--foreground)]/40 hover:text-[var(--foreground)]"
                  }`}
                >
                  Deshabilitado
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-8">
            <div className="w-[200px]">
              <SaveButton
                id="btn-edit-barber-save"
                type="submit"
                disabled={!canSave}
                loading={loading}
              />
            </div>
          </div>
        </form>
      </Modal>

      {popup.show && (
        <PopupModal
          message={popup.message}
          success={popup.success}
          onClose={() => {
            popup.close();
            onClose();
          }}
        />
      )}
    </>
  );
}
