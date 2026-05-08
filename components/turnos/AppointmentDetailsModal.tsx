"use client";

import { format } from "date-fns";
import { Appointment } from "@/lib/types/Appointment";
import Modal from "@/components/ui/Modal";
import PopupModal from "@/components/ui/PopupModal";
import dynamic from "next/dynamic";
import ConfirmModal from "../ui/ConfirmModal";
import DeleteButton from "../buttons/DeleteButton";
import ChargeButton from "../buttons/ChargeButton";
import SaveButton from "../buttons/SaveButton";
import BarberSelector from "./BarberSelector";
import { Barber } from "@/lib/types/Barbers";
import DatePickerField from "../admin/DatePickerField";
import TimeSelect from "../admin/TimeSelect";
import { generateAllAppointments } from "@/utils/appointments";
import Spinner from "../loading/Spinner";
import ClientAutocompleteFields from "./ClientAutocompleteFields";
import { useBusinessContext } from "@/lib/context/BusinessContext";
import { useAppointmentDetailsLogic } from "@/lib/hooks/useAppointmentDetailsLogic";

const ServicePaidModal = dynamic(() => import("./ServicePaidModal"), { ssr: false, loading: () => null });

export default function AppointmentDetailsModal({
  onClose,
  appointment,
  barbers,
}: Readonly<{
  onClose: () => void;
  appointment: Appointment;
  barbers: Barber[];
}>) {
  const { businessHours, businessSettings } = useBusinessContext();
  const allAppointments = generateAllAppointments({
    openTime: businessHours.open_time,
    closeTime: businessHours.close_time,
    stepMinutes: businessSettings.slot_step_minutes,
    breakStart: businessHours.lunch_start,
    breakEnd: businessHours.lunch_end,
  });

  const {
    loadingFetch, services, showService, setShowService, confirmModal, setConfirmModal,
    loading, loadingUpdate, popup,
    selectedBarberId, setSelectedBarberId, date, setDate, startTime, setStartTime,
    endTime, setEndTime, client, setClient, phone, setPhone, selectedServiceId, setSelectedServiceId,
    price, setPrice, isBlockedRange, hasChanges, handleDelete, handleUpdate,
  } = useAppointmentDetailsLogic(appointment, barbers);

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
        <h2 className="text-xl font-bold mb-4 text-center">Detalles del turno</h2>
        {appointment.updated_at && (
          <p className="text-xs text-center -mt-3 mb-4 text-[var(--button-home-disabled-text)]">
            Última actualización: {format(new Date(appointment.updated_at), "dd/MM/yyyy HH:mm")}
          </p>
        )}
        <form onSubmit={handleUpdate} className="space-y-4 px-4">
          <div className="my-5 text-left rounded-2lg">
            <label className="block text-sm font-medium mb-1 mt-4">
              Barbero
            </label>
            <BarberSelector barbers={barbers ?? []} selectedBarberId={selectedBarberId} onChange={setSelectedBarberId} className="w-full" />

            {isBlockedRange ? (
              <>
                <label className="block text-sm font-medium mb-1">
                  Día
                </label>
                <DatePickerField date={date} onChange={setDate} />

                <div className="flex space-x-6 my-4">
                  <TimeSelect label="Inicio" value={startTime} options={allAppointments} onChange={setStartTime} className="flex-1" />
                  <TimeSelect label="Fin" value={endTime} options={allAppointments.filter((t) => t > startTime)} onChange={setEndTime} className="flex-1" />
                </div>

                <label className="block text-sm font-medium mb-1 mt-4">
                  Motivo
                </label>
                <input type="text" value={client} onChange={(e) => setClient(e.target.value)} />
              </>
            ) : (
              <>
                <label className="block text-sm font-medium mb-1">
                  Día y horario
                </label>
                <div className="flex space-x-1">
                  <div className="w-[70%]">
                    <DatePickerField date={date} onChange={setDate} />
                  </div>
                  <div className="w-[30%]">
                    <TimeSelect label="" value={startTime} options={allAppointments} onChange={setStartTime} className="h-full" selectClassName="h-full" />
                  </div>
                </div>

                <ClientAutocompleteFields
                  name={client}
                  phone={phone}
                  onNameChange={setClient}
                  onPhoneChange={setPhone}
                  onClientResolved={() => {}}
                  showWhatsapp
                />

                <label className="block text-sm font-medium mb-1 mt-4">
                  Servicio
                </label>
                <select required className="border p-2 rounded w-full bg-[var(--background)] text-[var(--foreground)]" value={selectedServiceId} onChange={e => setSelectedServiceId(Number(e.target.value))} >
                  <option value={-1} disabled style={{ color: "grey" }}>
                    Selecciona un servicio
                  </option>
                  {services.map(s => (
                    <option key={s.id} value={s.id} style={{ color: "black" }}>
                      {s.name} ({s.duration} min)
                    </option>
                  ))}
                </select>

                {appointment.paid && (
                  <>
                    <label className="block text-sm font-medium mb-1 mt-4">
                      Precio cobrado
                    </label>
                    <input type="text" value={price} onChange={e => setPrice(Number(e.target.value))} />
                  </>
                )}
              </>
            )}

          </div>

          <div className="flex justify-center mt-10">
            <SaveButton type="submit" disabled={!hasChanges} loading={loadingUpdate} />
          </div>

          <div className="flex justify-center gap-5 mt-5">
            <DeleteButton disabled={appointment.paid} loading={loading} onClick={() => setConfirmModal(true)} />
            <ChargeButton onClick={() => setShowService(true)} disabled={appointment.paid || isBlockedRange} loading={loading} isPaid={appointment.paid} />
          </div>
        </form>
      </Modal>

      {popup.show && (
        <PopupModal
          message={popup.message}
          success={popup.success}
          onClose={() => {
            popup.close();
            if (popup.success) onClose();
          }}
        />
      )}

      {showService && (
        <ServicePaidModal
          appointment={appointment}
          setIsPaid={() => { }}
          onClose={() => {
            setShowService(false);
            onClose();
          }}
        />
      )}

      {confirmModal && (
        <ConfirmModal
          title={"¿Estás seguro que querés eliminar el turno?"}
          onConfirm={handleDelete}
          onCancel={() => setConfirmModal(false)}
          loading={loading}
          button="delete"
        />
      )}
    </>
  );
}
