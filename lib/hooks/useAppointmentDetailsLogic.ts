import { useState } from "react";
import { useFetchOnce } from "@/lib/hooks/useFetchOnce";
import { getServices } from "@/lib/repository/services";
import { deleteAppointment, updateAppointment } from "@/lib/repository/appointments";
import { upsertClient } from "@/lib/repository/clients";
import { Appointment, AppointmentUpdates } from "@/lib/types/Appointment";
import { Barber } from "@/lib/types/Barbers";
import { Service } from "@/lib/types/Services";
import { usePopup } from "@/lib/hooks/usePopup";

export function useAppointmentDetailsLogic(appointment: Appointment, barbers: Barber[]) {
  const { data, loading: loadingFetch } = useFetchOnce<Service[]>("services", getServices);
  const services: Service[] = data ?? [];
  const [showService, setShowService] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const popup = usePopup();

  // Datos del turno
  const [selectedBarberId, setSelectedBarberId] = useState(appointment.barber_id);
  const [date, setDate] = useState<Date | null>(new Date(`${appointment.date}T${appointment.start_time}-03:00`));
  const [startTime, setStartTime] = useState(appointment.start_time.slice(0, 5));
  const [endTime, setEndTime] = useState(appointment.end_time.slice(0, 5));
  const [client, setClient] = useState(appointment.client);
  const [phone, setPhone] = useState(appointment.phone ?? "");
  const [selectedServiceId, setSelectedServiceId] = useState(appointment.service_id);
  const [price, setPrice] = useState(appointment.price);

  const isBlockedRange = appointment.phone === "0000000000";
  const hasChanges =
    selectedBarberId !== appointment.barber_id ||
    date?.toISOString().slice(0, 10) !== appointment.date ||
    startTime !== appointment.start_time ||
    endTime !== appointment.end_time ||
    client !== appointment.client ||
    phone !== (appointment.phone ?? "") ||
    price !== appointment.price ||
    selectedServiceId !== appointment.service_id;

  const handleDelete = async () => {
    setLoading(true);
    const barberName = barbers?.find((b) => b.id === selectedBarberId)?.name || "admin";
    const success = await deleteAppointment(appointment.id, barberName);
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
      const service = services.find((s) => s.id === selectedServiceId);
      if (service) {
        const duration = service.duration;
        const endDate = new Date(`${date!.toISOString().slice(0, 10)}T${startTime}-03:00`);
        endDate.setMinutes(endDate.getMinutes() + duration);
        updates.end_time = endDate.toTimeString().slice(0, 5);
      }
    }

    if (!isBlockedRange && client && phone) {
      const clientRecord = await upsertClient(client, phone);
      if (clientRecord) updates.client_id = clientRecord.id;
    }

    const success = await updateAppointment(appointment.id, updates);
    popup.open(success ? "Turno editado con éxito" : "Error al editar el turno", success);
    setLoadingUpdate(false);
  };

  return {
    loadingFetch,
    services,
    showService,
    setShowService,
    confirmModal,
    setConfirmModal,
    loading,
    loadingUpdate,
    popup,
    selectedBarberId,
    setSelectedBarberId,
    date,
    setDate,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    client,
    setClient,
    phone,
    setPhone,
    selectedServiceId,
    setSelectedServiceId,
    price,
    setPrice,
    isBlockedRange,
    hasChanges,
    handleDelete,
    handleUpdate,
  };
}
