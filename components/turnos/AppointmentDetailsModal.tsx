"use client";

import { useState } from "react";
import { deleteAppointment, updateAppointment } from "@/lib/repository/appointments";
import { Appointment, AppointmentUpdates } from "@/lib/types/Appointment";
import Modal from "@/components/ui/Modal";
import PopupModal from "@/components/ui/PopupModal";
import { usePopup } from "@/lib/hooks/usePopup";
import dynamic from "next/dynamic";
import ConfirmModal from "../ui/ConfirmModal";
import DeleteButton from "../buttons/DeleteButton";
import ChargeButton from "../buttons/ChargeButton";
import SaveButton from "../buttons/SaveButton";
import BarberSelector from "./BarberSelector";
import { useFetchOnce } from "@/lib/hooks/useFetchOnce";
import { Barber } from "@/lib/types/Barbers";
import DatePickerField from "../admin/DatePickerField";
import { getServices } from "@/lib/repository/services";
import { Service } from "@/lib/types/Services";
import TimeSelect from "../admin/TimeSelect";
import { generateAllAppointments } from "@/utils/appointments";
import Spinner from "../loading/Spinner";
import { FaWhatsapp } from "react-icons/fa";
import { sendWhatsAppMessage } from "@/utils/whatsapp";

const ServicePaidModal = dynamic(() => import("./ServicePaidModal"), { ssr: false, loading: () => null });

export default function AppointmentDetailsModal({ onClose, appointment, barbers }: Readonly<{ onClose: () => void; appointment: Appointment; barbers: Barber[] }>) {
  const allAppointments = generateAllAppointments();
  const { data, loading: loadingFetch } = useFetchOnce<Service[]>(getServices);
  const services: Service[] = data ?? [];
  const [showService, setShowService] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const popup = usePopup();

  // datos del turno
  const [selectedBarberId, setSelectedBarberId] = useState(appointment.barber_id);
  const [date, setDate] = useState<Date | null>(new Date(`${appointment.date}T${appointment.start_time}-03:00`));
  const [startTime, setStartTime] = useState(appointment.start_time.slice(0, 5));
  const [endTime, setEndTime] = useState(appointment.end_time.slice(0, 5));
  const [client, setClient] = useState(appointment.client);
  const [phone, setPhone] = useState(appointment.phone);
  const [selectedServiceId, setSelectedServiceId] = useState(appointment.service_id);
  const [price, setPrice] = useState(appointment.price);

  //estados botones
  const isBlockedRange = appointment.phone === "0000000000";
  const hasChanges = selectedBarberId !== appointment.barber_id ||
    date?.toISOString().slice(0, 10) !== appointment.date ||
    startTime !== appointment.start_time ||
    endTime !== appointment.end_time ||
    client !== appointment.client ||
    phone !== appointment.phone ||
    price !== appointment.price ||
    selectedServiceId !== appointment.service_id;

  const handleDelete = async () => {
    setLoading(true);
    const success = await deleteAppointment(appointment.id);
    popup.open(success ? "Turno eliminado con éxito" : "Error al eliminar el turno", success);
    setConfirmModal(false);
    setLoading(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges) return;
    setLoadingUpdate(true);
    const updates: AppointmentUpdates = {};
    if (selectedBarberId !== appointment.barber_id) updates.barber_id = selectedBarberId;
    if (date) {
      const isoDate = date.toISOString().slice(0, 10);
      if (isoDate !== appointment.date) updates.date = isoDate;
    }
    if (startTime !== appointment.start_time) updates.start_time = startTime;
    if (endTime !== appointment.end_time) updates.end_time = endTime;
    if (client !== appointment.client) updates.client = client;
    if (phone !== appointment.phone) updates.phone = phone;
    if (selectedServiceId !== appointment.service_id) updates.service_id = selectedServiceId;
    if (price !== appointment.price) updates.price = price;
    if (!isBlockedRange && ("start_time" in updates || "service_id" in updates)) {
      const service = services.find(s => s.id === selectedServiceId);
      const duration = service!.duration;
      const endDate = new Date(`${date!.toISOString().slice(0, 10)}T${startTime}-03:00`);
      endDate.setMinutes(endDate.getMinutes() + duration);
      updates.end_time = endDate.toTimeString().slice(0, 5);
    }
    const success = await updateAppointment(appointment.id, updates);
    popup.open(success ? "Turno editado con éxito" : "Error al editar el turno", success);
    setLoadingUpdate(false);
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
        <h2 className="text-xl font-bold mb-4 text-center">Detalles del turno</h2>
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


                <label className="block text-sm font-medium mb-1 mt-4">
                  Cliente
                </label>
                <input type="text" value={client} onChange={(e) => setClient(e.target.value)} />

                <label className="block text-sm font-medium mb-1 mt-4">
                  Celular
                </label>
                <div className="flex items-center space-x-1 mt-1">
                  <input type="text" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ""))} />
                  <button onClick={() => sendWhatsAppMessage('Hola, te escribimos por lo siguiente...', phone)} className="btn-whatsapp !rounded-lg !px-2 !py-1.5" aria-label="Enviar Whatsapp" title="Enviar Whatsapp" >
                    <FaWhatsapp size={30} color="white" />
                  </button>
                </div>

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
