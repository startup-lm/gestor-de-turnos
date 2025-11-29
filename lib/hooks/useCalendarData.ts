import { useCallback, useEffect, useState } from 'react';
import { getBarbersAppointmentsFromDates } from '@/lib/repository/appointments';
import { useRealtimeData } from '@/lib/hooks/useRealtime';
import { Appointment } from '@/lib/types/Appointment';
import { CalendarEvent } from '@/lib/types/CalendarEvent';
import { transformAppointmentsToEvents } from '@/utils/appointments';

export function useCalendarData(
  selectedBarberId: number,
  role: string,
  range: { start: Date; end: Date }
) {
  const fetchAppointments = useCallback(
    () => getBarbersAppointmentsFromDates(selectedBarberId, range.start, range.end),
    [selectedBarberId, range]
  );
  const realtimeAppointments = useRealtimeData('appointments', fetchAppointments);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [allAppointments, setAllAppointments] = useState<Appointment[] | null>(null);

  useEffect(() => {
    if (realtimeAppointments) {
      setAllAppointments(realtimeAppointments);
      setEvents(transformAppointmentsToEvents(realtimeAppointments, role));
    }
  }, [realtimeAppointments, role]);
  
  return { events, allAppointments };
}
