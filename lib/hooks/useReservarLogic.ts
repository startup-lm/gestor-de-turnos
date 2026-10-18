import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useFetchOnce } from "@/lib/hooks/useFetchOnce";
import { Service } from "@/lib/types/Services";
import { getServices } from "@/lib/repository/services";
import { searchClients, upsertClient } from "@/lib/repository/clients";
import { createAppointment } from "@/lib/repository/appointments";
import { CalendarEvent } from "@/lib/types/CalendarEvent";
import { Barber } from "@/lib/types/Barbers";
import { useBusinessContext } from "@/lib/context/BusinessContext";
import { usePopup } from "@/lib/hooks/usePopup";

export function useReservarLogic(
  selectedDate: Date,
  selectedBarber: string,
  selectedBarberId: number,
  events: CalendarEvent[],
  onAppointmentCreated?: () => void,
  barbers?: Barber[],
  initialServiceId?: number
) {
  const { role } = useAuth();
  const { businessHours, businessSettings } = useBusinessContext();
  const { data: services = [] } = useFetchOnce<Service[]>("services", getServices);
  const isGuest = role === "guest";

  const [selectedServiceId, setSelectedServiceId] = useState(initialServiceId ?? -1);

  useEffect(() => {
    if (initialServiceId !== undefined && initialServiceId > 0) {
      setSelectedServiceId(initialServiceId);
    } else {
      setSelectedServiceId(-1);
    }
  }, [initialServiceId]);
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

  // Pre-asignación del barbero libre en tiempo de ejecución
  const assignedBarber = useMemo(() => {
    if (selectedBarberId !== 0) {
      return { id: selectedBarberId, name: selectedBarber };
    }
    const activeBarbers = (barbers || []).filter(b => b.id !== undefined && b.id !== 0);
    const service = services?.find(s => s.id === selectedServiceId) ?? services?.[0];
    const duration = service?.duration ?? 30;
    const endDate = new Date(selectedDate);
    endDate.setMinutes(endDate.getMinutes() + duration);

    const freeBarbers = activeBarbers.filter(barber => {
      const hasConflict = events.some(ev => {
        if (ev.barber_id !== barber.id) return false;
        return selectedDate < ev.end! && endDate > ev.start!;
      });
      return !hasConflict;
    });

    let chosenBarber = null;

    if (freeBarbers.length > 0) {
      const criteria = businessSettings?.assignment_criteria ?? "random";

      if (criteria === "balanced") {
        const getApptCount = (barberId: number) => {
          return events.filter(ev => 
            ev.barber_id === barberId && 
            ev.isAppt && 
            ev.start.getFullYear() === selectedDate.getFullYear() &&
            ev.start.getMonth() === selectedDate.getMonth() &&
            ev.start.getDate() === selectedDate.getDate()
          ).length;
        };

        const sorted = [...freeBarbers].sort((a, b) => {
          const countA = getApptCount(a.id!);
          const countB = getApptCount(b.id!);
          if (countA !== countB) return countA - countB;
          return (a.id ?? 0) - (b.id ?? 0); // stable fallback
        });
        chosenBarber = sorted[0];
      } else if (criteria === "prioritize_admin") {
        const sorted = [...freeBarbers].sort((a, b) => {
          const isAAdmin = a.role === "admin" ? 1 : 0;
          const isBAdmin = b.role === "admin" ? 1 : 0;
          if (isAAdmin !== isBAdmin) {
            return isBAdmin - isAAdmin; // admin comes first
          }
          return (a.id ?? 0) - (b.id ?? 0); // stable fallback
        });
        chosenBarber = sorted[0];
      } else if (criteria === "prioritize_barber") {
        const sorted = [...freeBarbers].sort((a, b) => {
          const isABarber = a.role === "barber" ? 1 : 0;
          const isBBarber = b.role === "barber" ? 1 : 0;
          if (isABarber !== isBBarber) {
            return isBBarber - isABarber; // barber comes first
          }
          return (a.id ?? 0) - (b.id ?? 0); // stable fallback
        });
        chosenBarber = sorted[0];
      } else {
        // random
        const seed = selectedDate.getTime();
        const pseudoRandom = (val: number) => {
          const x = Math.sin(val) * 10000;
          return x - Math.floor(x);
        };
        const index = Math.floor(pseudoRandom(seed) * freeBarbers.length);
        chosenBarber = freeBarbers[index];
      }
    }

    if (chosenBarber) {
      return { id: chosenBarber.id ?? 0, name: chosenBarber.name };
    }
    return activeBarbers.length > 0
      ? { id: activeBarbers[0].id ?? 0, name: activeBarbers[0].name }
      : { id: 0, name: "No tengo preferencia" };
  }, [selectedBarberId, selectedBarber, barbers, selectedDate, selectedServiceId, services, events, businessSettings]);

  const handleReservar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const service = services?.find(s => s.id === selectedServiceId);
    if (!service) {
      popup.open("Debes seleccionar un servicio para agendar el turno.", false);
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

    const finalBarberId = assignedBarber.id;
    const assignedBarberName = assignedBarber.name;

    if (selectedBarberId === 0) {
      const activeBarbers = (barbers || []).filter(b => b.id && b.id !== 0);
      const freeBarbers = activeBarbers.filter(barber => {
        const hasConflict = events.some(ev => {
          if (ev.barber_id !== barber.id) return false;
          return selectedDate < ev.end! && endDate > ev.start!;
        });
        return !hasConflict;
      });

      if (freeBarbers.length === 0) {
        if (isGuest) {
          popup.open("Lo sentimos, no hay barberos disponibles en el horario seleccionado.", false);
          setLoading(false);
          return;
        } else {
          if (activeBarbers.length === 0) {
            popup.open("Error: No hay barberos activos registrados.", false);
            setLoading(false);
            return;
          }
        }
      }
    } else {
      const conflict = events.some(ev => selectedDate < ev.end! && endDate > ev.start!);
      if (isGuest && conflict) {
        const msg = `Tu turno de ${selectedDate.toTimeString().slice(0, 5)} a ${endDate.toTimeString().slice(0, 5)} coincide con otro ya agendado. Por favor, elegí otro horario.`;
        popup.open(msg, false);
        setLoading(false);
        return;
      }
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
      barber_id: finalBarberId,
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

    let successMsg = "";
    if (selectedBarberId === 0) {
      successMsg = bienvenidaName
        ? `¡Bienvenido de nuevo, ${bienvenidaName}!\nTu turno con ${assignedBarberName} fue reservado con éxito.\nNúmero de turno: #${result.id}`
        : `Tu turno con ${assignedBarberName} fue reservado con éxito.\nNúmero de turno: #${result.id}`;
    } else {
      successMsg = bienvenidaName
        ? `¡Bienvenido de nuevo, ${bienvenidaName}!\nTu turno fue reservado con éxito.\nNúmero de turno: #${result.id}`
        : `Tu turno fue reservado con éxito.\nNúmero de turno: #${result.id}`;
    }

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
    assignedBarber,
  };
}
