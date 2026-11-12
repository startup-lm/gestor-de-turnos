import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useFetchOnce } from "@/lib/hooks/useFetchOnce";
import { Service } from "@/lib/types/Services";
import { getServices } from "@/lib/repository/services";
import { lookupClientByPhone } from "@/lib/repository/clients";
import { createAppointment } from "@/lib/repository/appointments";
import { CalendarEvent } from "@/lib/types/CalendarEvent";
import { Barber } from "@/lib/types/Barbers";
import { useBusinessContext } from "@/lib/context/BusinessContext";
import { toast } from "@/lib/store/useToastStore";
import { normalizePhone } from "@/utils/phone";

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
  const [confirmedService, setConfirmedService] = useState<Service | null>(null);

  const isDisabled = !name || (isGuest && !phone) || selectedServiceId < 0;

  // Reconocimiento seguro por teléfono para clientes habituales (guest)
  useEffect(() => {
    if (!isGuest) {
      setBienvenidaName(null);
      return;
    }
    const norm = normalizePhone(phone);
    if (!norm.isValid || norm.national.length < 10) {
      setBienvenidaName(null);
      return;
    }

    lookupClientByPhone(phone).then((res) => {
      if (res.found && res.firstName) {
        setBienvenidaName(res.firstName);
      } else {
        setBienvenidaName(null);
      }
    });
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
      toast.error("Debes seleccionar un servicio para agendar el turno.");
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
        toast.error(`No se puede reservar: el turno finaliza dentro de ${reasons}.`);
        setLoading(false);
        return;
      }
    }

    const finalBarberId = assignedBarber.id;

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
          toast.error("Lo sentimos, no hay barberos disponibles en el horario seleccionado.");
          setLoading(false);
          return;
        } else {
          if (activeBarbers.length === 0) {
            toast.error("Error: No hay barberos activos registrados.");
            setLoading(false);
            return;
          }
        }
      }
    } else {
      const conflict = events.some(ev => selectedDate < ev.end! && endDate > ev.start!);
      if (isGuest && conflict) {
        const msg = `Tu turno de ${selectedDate.toTimeString().slice(0, 5)} a ${endDate.toTimeString().slice(0, 5)} coincide con otro ya agendado. Por favor, elegí otro horario.`;
        toast.error(msg);
        setLoading(false);
        return;
      }
    }

    let finalPhone = phone;
    if (phone) {
      const norm = normalizePhone(phone);
      if (isGuest && !norm.isValid) {
        toast.error("Por favor ingresá un número de celular válido de Argentina (10 dígitos, ej: 11 2345 6789).");
        setLoading(false);
        return;
      }
      if (norm.isValid) {
        finalPhone = norm.e164;
      }
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
    });

    if (result.success && result.id) {
      setAppointmentId(result.id);
      setConfirmedService(service);
      setShowWhatsapp(true);
      onAppointmentCreated?.();
    }

    if (!result.success) {
      toast.error("Error al reservar el turno. Por favor intenta nuevamente.");
    }
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
    handleReservar,
    assignedBarber,
    confirmedService,
  };
}
