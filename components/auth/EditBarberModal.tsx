"use client";

import { useState } from "react";
import { useFetchOnce } from "@/lib/hooks/useFetchOnce";
import { getBarbers, updateBarber } from "@/lib/repository/barbers";
import { Barber } from "@/lib/types/Barbers";
import BarberSelector from "@/components/turnos/BarberSelector";
import Modal from "@/components/ui/Modal";
import PopupModal from "@/components/ui/PopupModal";
import Spinner from "@/components/loading/Spinner";
import { usePopup } from "@/lib/hooks/usePopup";
import { Check } from "lucide-react";
import SaveButton from "../buttons/SaveButton";
import { deleteAuthUser } from "@/lib/repository/auth";

export default function EditBarberModal({ onClose }: Readonly<{ onClose: () => void }>) {
  const { data: barbers = [], loading: fetchLoading } = useFetchOnce<Barber[]>(getBarbers);
  const [selectedBarberId, setSelectedBarberId] = useState<number>(-1);
  const [commission, setCommission] = useState<string>("");
  const [initialCommission, setInitialCommission] = useState<string>("");
  const [statusEnabled, setStatusEnabled] = useState<boolean>(true);
  const [initialStatus, setInitialStatus] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const popup = usePopup();
  const formDisabled = selectedBarberId < 0;
  const checklistOptions = [
    { label: "Habilitado", value: true },
    { label: "Deshabilitado", value: false },
  ];

  const handleBarberChange = (id: number) => {
    setSelectedBarberId(id);
    if (!barbers) return;
    const found = barbers.find((b) => b.id === id);
    if (found) {
      const percent = ((found.commission ?? 0) * 100).toFixed(1);
      setCommission(percent);
      setInitialCommission(percent);
      setStatusEnabled(Boolean(found.active));
      setInitialStatus(Boolean(found.active));
    } else {
      setCommission("");
      setInitialCommission("");
      setStatusEnabled(true);
      setInitialStatus(true);
    }
  };

  const canSave = !formDisabled && (commission !== initialCommission || statusEnabled !== initialStatus);
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setLoading(true);
    const commissionFraction = parseFloat(commission) / 100;
    const updated = await updateBarber(selectedBarberId, { commission: commissionFraction, active: statusEnabled, });
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
      <Modal onClose={onClose}>
        <h2 className="text-xl font-bold mb-4 text-center">Editar Barbero</h2>
        <form onSubmit={handleSave} className="px-4">
          <div className="text-left rounded-2lg mt-5 shadow-lg space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1">Barbero</label>
              <BarberSelector
                barbers={barbers ?? []}
                selectedBarberId={selectedBarberId}
                onChange={handleBarberChange}
                className="w-full"
              />
            </div>

            <div className={formDisabled ? "opacity-50 pointer-events-none" : ""}>
              <label className="block text-sm font-medium mb-1">Ganancia por corte</label>
              <div className="relative w-30">
                <input type="number" min="0" max="100" step="0.1" value={Number(commission)}
                  onChange={(e) => setCommission(e.target.value)} disabled={formDisabled} className="border rounded p-2 pr-8" />
                <span className="font-medium absolute right-2 top-1/2 -translate-y-1/2">%</span>
              </div>
            </div>

            <div className={formDisabled ? "opacity-50 pointer-events-none" : ""}>
              <label className="block text-sm font-medium mb-1">Estado</label>
              <div className="flex items-center space-x-6">
                {checklistOptions.map(({ label, value }) => (
                  <label
                    key={label}
                    className="flex items-center gap-2 cursor-pointer select-none"
                  >
                    <input
                      type="radio"
                      name="status"
                      checked={statusEnabled === value}
                      onChange={() => setStatusEnabled(value)}
                      disabled={formDisabled}
                      className="hidden"
                    />
                    <span
                      className={`w-5 h-5 flex items-center justify-center border rounded-full transition-colors duration-200 ${statusEnabled === value
                        ? "bg-blue-600 border-blue-600"
                        : "bg-white dark:bg-gray-700 border-gray-400"
                        }`}
                    >
                      {statusEnabled === value && <Check className="w-4 h-4 text-white" />}
                    </span>
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-10">
            <SaveButton
              type="submit"
              disabled={!canSave}
              loading={loading}
            />
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
