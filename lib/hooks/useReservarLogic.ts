import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useFetchOnce } from "@/lib/hooks/useFetchOnce";
import { Service } from "@/lib/types/Services";
import { getServices } from "@/lib/repository/services";
import { searchClients, upsertClient } from "@/lib/repository/clients";
import { createAppointment } from "@/lib/repository/appointments";
import { CalendarEvent } from "@/lib/types/CalendarEvent";
import { useBusinessContext } from "@/lib/context/BusinessContext";
import { usePopup } from "@/lib/hooks/usePopup";

export function useReservarLogic(
  selectedDate: Date,
  selectedBarber: string,
  selectedBarberId: number,
  events: CalendarEvent[],
  onAppointmentCreated?: () => void
) {
  const { role } = useAuth();
  const { businessHours } = useBusinessContext();
  const { data: services = [] } = useFetchOnce<Service[]>("services", getServices);
  const isGuest = role === "guest";

  const [selectedServiceId, setSelectedServiceId] = useState(-1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [appointmentId, setAppointmentId] = useState(0);
  const [showWhatsapp, setShowWhatsapp] = useState(false);
  const [bienvenidaName, setBienvenidaName] = useState<string | null>(null);

  const isDisabled = !name || (isGuest && !phone) || selectedServiceId < 0;
  const popup = usePopup();

  // Reconocimiento por teléfono para clientes (guest)
  useEffect(() => {
    if (!isGuest || phone.length < 10) {
      setBienvenidaName(null);
      return;
    }
    searchClients(phone).then((results) => {
      if (results.length > 0 && results[0].phone === phone) {
        const firstName = results[0].name.split(" ")[0];
        setBienvenidaName(firstName);
        if (!name) setName(results[0].name);
      } else {
        setBienvenidaName(null);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone, isGuest]);

  const setTimeOn = (base: Date, hhmm?: string | null) => {
    if (!hhmm) return null;
    const [h, m] = hhmm.split(":").map(Number);
    const d = new Date(base);
    d.setHours(h ?? 0, m ?? 0, 0, 0);
    return d;
  };

  const handleReservar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const service = services?.find(s => s.id === selectedServiceId);
    if (!service) {
      setLoading(false);
      return;
    }
    const duration = service.duration;
    const endDate = new Date(selectedDate);
    endDate.setMinutes(endDate.getMinutes() + duration);

    if (isGuest && businessHours) {
      const cierre = setTimeOn(selectedDate, businessHours.close_time);
      const startBreak = setTimeOn(selectedDate, businessHours.lunch_start);
      const endBreak = setTimeOn(selectedDate, businessHours.lunch_end);
      const overlapsLunch = startBreak && endBreak ? endDate < endBreak && endDate > startBreak : false;
      if ((cierre && endDate > cierre) || overlapsLunch) {
        const lunchWindow = startBreak && endBreak ? `${startBreak.toTimeString().slice(0, 5)}-${endBreak.toTimeString().slice(0, 5)}` : null;
        const cierreTime = cierre ? cierre.toTimeString().slice(0, 5) : null;
        const reasons = [lunchWindow && `el horario de almuerzo (${lunchWindow})`, cierreTime && `el horario de cierre (${cierreTime} hs)`].filter(Boolean).join(" o ");
        popup.open(`No se puede reservar: el turno finaliza dentro de ${reasons}.`, false);
        setLoading(false);
        return;
      }
    }

    const conflict = events.some(ev => selectedDate < ev.end! && endDate > ev.start!);
    if (isGuest && conflict) {
      const msg = `Tu turno de ${selectedDate.toTimeString().slice(0, 5)} a ${endDate.toTimeString().slice(0, 5)} coincide con otro ya agendado. Por favor, elegí otro horario.`;
      popup.open(msg, false);
      setLoading(false);
      return;
    }

    let finalPhone = phone;
    if (finalPhone && finalPhone.startsWith("+54") && !finalPhone.startsWith("+549")) {
      const rest = finalPhone.slice(3);
      if (rest.length !== 10) {
        popup.open("El número de Argentina debe tener exactamente 10 dígitos.", false);
        setLoading(false);
        return;
      }
      finalPhone = `+549${rest}`;
    }

    let clientId: number | undefined;
    if (name && finalPhone) {
      const clientRecord = await upsertClient(name, finalPhone);
      if (clientRecord) clientId = clientRecord.id;
    }

    const createdBy = isGuest ? name : selectedBarber;
    const result = await createAppointment({
      client: name,
      barber_id: selectedBarberId,
      date: selectedDate,
      start_time: selectedDate.toTimeString().slice(0, 5),
      end_time: endDate.toTimeString().slice(0, 5),
      phone: finalPhone,
      service_id: selectedServiceId,
      created_by: createdBy,
      client_id: clientId,
    });

    if (result.success && result.id) {
      setAppointmentId(result.id);
      setShowWhatsapp(true);
      onAppointmentCreated?.();
    }
    const successMsg = bienvenidaName
      ? `Bienvenido de nuevo, ${bienvenidaName}!\nTu turno fue reservado con éxito.\nNúmero de turno: #${result.id}`
      : `Tu turno fue reservado con éxito.\nNúmero de turno: #${result.id}`;

    popup.open(result.success ? successMsg : "Error al reservar el turno", result.success);
    setLoading(false);
  };

  return {
    isGuest,
    services,
    selectedServiceId,
    setSelectedServiceId,
    name,
    setName,
    phone,
    setPhone,
    loading,
    appointmentId,
    showWhatsapp,
    bienvenidaName,
    isDisabled,
    popup,
    handleReservar,
  };
}
