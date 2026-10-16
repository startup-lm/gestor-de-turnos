"use client";

import { useRef } from "react";
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
import { Receipt } from "lucide-react";

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
  const { businessHours, businessSettings, isEnabled } = useBusinessContext();
  const ARCA_ENABLED = isEnabled("arca");
  const hasPaidRef = useRef(false);
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
      <Modal onClose={onClose} size="lg">
        <h2 className="text-2xl font-extrabold mb-2 text-center bg-gradient-to-r from-[var(--foreground)] via-[var(--foreground)] to-[var(--accent)] bg-clip-text text-transparent tracking-tight">
          Detalles del turno
        </h2>
        {appointment.updated_at && (
          <p className="text-xs text-center mb-3 text-[var(--button-home-disabled-text)]">
            Última actualización: {format(new Date(appointment.updated_at), "dd/MM/yyyy HH:mm")}
          </p>
        )}

        {/* Badge de comprobante ARCA emitido */}
        {ARCA_ENABLED && appointment.arca_invoice_id && (
          <div className="flex items-center justify-center gap-1.5 mb-4 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full w-fit mx-auto">
            <Receipt className="w-3.5 h-3.5 text-green-400 shrink-0" />
            <span className="text-xs text-green-300 font-medium">
              Comprobante emitido
            </span>
          </div>
        )}
        <form onSubmit={handleUpdate} className="space-y-6 px-2 text-left">
          {isBlockedRange ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">Barbero</label>
                <BarberSelector id="appt-barber" barbers={barbers ?? []} selectedBarberId={selectedBarberId} onChange={setSelectedBarberId} className="w-full" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">Día</label>
                <DatePickerField date={date} onChange={setDate} />
              </div>
              <div className="md:col-span-2 grid grid-cols-2 gap-4">
                <TimeSelect id="appt-blocked-start-time" label="Inicio" value={startTime} options={allAppointments} onChange={setStartTime} />
                <TimeSelect id="appt-blocked-end-time" label="Fin" value={endTime} options={allAppointments.filter((t) => t > startTime)} onChange={setEndTime} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">Motivo</label>
                <input 
                  id="appt-blocked-reason" 
                  type="text" 
                  value={client} 
                  onChange={(e) => setClient(e.target.value)} 
                  className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-lg p-2.5 w-full block text-sm"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">Barbero</label>
                  <BarberSelector id="appt-barber" barbers={barbers ?? []} selectedBarberId={selectedBarberId} onChange={setSelectedBarberId} className="w-full" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">Día y horario</label>
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <DatePickerField date={date} onChange={setDate} />
                    </div>
                    <div className="w-[110px]">
                      <TimeSelect id="appt-start-time" label="" value={startTime} options={allAppointments} onChange={setStartTime} className="h-full" selectClassName="!h-[42px]" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">Servicio</label>
                  <select 
                    id="appt-service" 
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
                        {s.name} ({s.duration} min)
                      </option>
                    ))}
                  </select>
                </div>
                {appointment.paid && (
                  <div>
                    <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">Precio cobrado</label>
                    <input 
                      id="appt-price" 
                      type="text" 
                      value={price} 
                      onChange={e => setPrice(Number(e.target.value))} 
                      className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-lg p-2.5 w-full block text-sm"
                    />
                  </div>
                )}
              </div>
              <div>
                <ClientAutocompleteFields
                  name={client}
                  phone={phone}
                  onNameChange={setClient}
                  onPhoneChange={setPhone}
                  onClientResolved={() => {}}
                  showWhatsapp
                />
              </div>
            </div>
          )}

          <div className="flex justify-center pt-4">
            <div className="w-[220px]">
              <ChargeButton id="btn-appt-charge" onClick={() => setShowService(true)} disabled={appointment.paid || isBlockedRange} loading={loading} isPaid={appointment.paid} />
            </div>
          </div>

          <div className="flex justify-center gap-5 pt-2">
            <div className="w-[180px]">
              <DeleteButton id="btn-appt-delete" disabled={appointment.paid} loading={loading} onClick={() => setConfirmModal(true)} />
            </div>
            <div className="w-[180px]">
              <SaveButton id="btn-appt-save" type="submit" disabled={!hasChanges} loading={loadingUpdate} />
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
            if (popup.success) onClose();
          }}
        />
      )}

      {showService && (
        <ServicePaidModal
          appointment={appointment}
          setIsPaid={(paid) => {
            if (paid) {
              hasPaidRef.current = true;
            }
          }}
          onClose={() => {
            setShowService(false);
            if (hasPaidRef.current) {
              onClose();
            }
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
