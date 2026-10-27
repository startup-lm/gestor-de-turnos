'use client';

import React, { useCallback } from 'react';
import { Calendar, dateFnsLocalizer, SlotInfo, ToolbarProps } from 'react-big-calendar';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '@/styles/calendar.css';
import { Appointment } from '@/lib/types/Appointment';
import { CalendarEvent } from '@/lib/types/CalendarEvent';
import { Barber } from '@/lib/types/Barbers';
import { CalendarSkeleton } from '@/components/loading/Skeleton';
import { formats } from '@/components/calendar/CalendarFormats';
import { useCalendarData } from '@/lib/hooks/useCalendarData';
import { useCalendarNavigation } from '@/lib/hooks/useCalendarNavigation';
import DatePickerField from '../admin/DatePickerField';
import { useBusinessContext } from '@/lib/context/BusinessContext';

const locales = {
  es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

interface CustomCalendarProps {
  selectedBarberId: number;
  barbers: Barber[];
  role: string;
  isMobile: boolean;
  onSlotClick: (appointment: Appointment, events: CalendarEvent[]) => void;
  onEventClick: (appointment: Appointment) => void;
  refreshSignal?: number;
}

function CustomCalendarToolbar({ label, onNavigate }: ToolbarProps<CalendarEvent, object>) {
  return (
    <div className="flex items-center justify-between mb-4 pb-3 border-b border-black/10 select-none">
      {/* Botón Hoy a la izquierda */}
      <div className="flex-1 basis-0 flex items-center justify-start">
        <button
          type="button"
          onClick={() => onNavigate('TODAY')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/20 bg-black/5 hover:bg-black/10 active:scale-95 text-xs font-bold text-slate-900 transition-all shadow-sm"
          title="Ir al día de hoy"
        >
          <CalendarIcon className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Hoy</span>
        </button>
      </div>

      {/* Bloque central: [<] Semana del ... [>] */}
      <div className="flex items-center justify-center gap-2 sm:gap-3.5 shrink-0">
        <button
          type="button"
          onClick={() => onNavigate('PREV')}
          className="p-1.5 sm:p-2 rounded-xl border border-black/20 bg-black/5 hover:bg-black/10 active:scale-95 text-slate-900 transition-all shadow-sm flex items-center justify-center"
          title="Semana anterior"
          aria-label="Semana anterior"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
        </button>

        <span className="text-sm sm:text-base md:text-lg font-black tracking-tight text-slate-900 text-center">
          {label}
        </span>

        <button
          type="button"
          onClick={() => onNavigate('NEXT')}
          className="p-1.5 sm:p-2 rounded-xl border border-black/20 bg-black/5 hover:bg-black/10 active:scale-95 text-slate-900 transition-all shadow-sm flex items-center justify-center"
          title="Semana siguiente"
          aria-label="Semana siguiente"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* Espaciador equilibrado a la derecha para que el centro quede 100% simétrico */}
      <div className="flex-1 basis-0 flex items-center justify-end" />
    </div>
  );
}

function CustomCalendarComponent({ selectedBarberId, barbers, role, isMobile, onSlotClick, onEventClick, refreshSignal, }: Readonly<CustomCalendarProps>) {
  const { businessHours, businessSettings } = useBusinessContext();
  const { currentDate, currentRange, onNavigate, onRangeChange } = useCalendarNavigation();
  const { events, allAppointments } = useCalendarData(selectedBarberId, role, currentRange, refreshSignal);

  const parseHHMM = (s: string) => {
    const [h, m] = s.split(':').map(Number);
    return { H: h ?? 0, M: m ?? 0 };
  };
  const setTimeOn = (base: Date, hhmm?: string | null) => {
    if (!hhmm) return null;
    const { H, M } = parseHHMM(hhmm);
    const d = new Date(base);
    d.setHours(H, M, 0, 0);
    return d;
  };
  const isClosedDay = useCallback(
    (d: Date) => businessHours.closed_days.includes(d.getDay()),
    [businessHours.closed_days]
  );
  const isLunchBreak = useCallback(
    (d: Date) => {
      if (!businessHours.lunch_start || !businessHours.lunch_end) return false;
      const ls = setTimeOn(d, businessHours.lunch_start)!;
      const le = setTimeOn(d, businessHours.lunch_end)!;
      return d >= ls && d < le;
    },
    [businessHours.lunch_start, businessHours.lunch_end]
  );
  const calendarMin = setTimeOn(currentDate, businessHours.open_time) ?? new Date(new Date(currentDate).setHours(8, 0, 0, 0));
  const calendarMax = setTimeOn(currentDate, businessHours.close_time) ?? new Date(new Date(currentDate).setHours(22, 0, 0, 0));
  const step = businessSettings.slot_step_minutes ?? 30;
  const timeslots = 1;
  const currentView = isMobile ? 'day' : 'week';
  const availableViews = isMobile ? { day: true } : { week: true };

  const handleSelectSlot = useCallback(
    (slotInfo: SlotInfo) => {
      const now = new Date();
      if (slotInfo.start < now && role === "guest") return;
      if (isClosedDay(slotInfo.start) || isLunchBreak(slotInfo.start)) return;
      const eventPaddingMs = 60 * 1000;
      
      let overlapsEvent = false;
      if (selectedBarberId === 0) {
        const busyBarberIds = new Set<number>();
        events.forEach(ev => {
          const originalStart = new Date(ev.start.getTime() - eventPaddingMs);
          const originalEnd = new Date(ev.end.getTime() + eventPaddingMs);
          if (slotInfo.start < originalEnd && slotInfo.end > originalStart) {
            if (ev.barber_id) {
              busyBarberIds.add(ev.barber_id);
            }
          }
        });
        const activeBarbers = barbers.filter(b => b.id && b.id !== 0);
        overlapsEvent = busyBarberIds.size >= activeBarbers.length;
      } else {
        overlapsEvent = events.some(ev => {
          const originalStart = new Date(ev.start.getTime() - eventPaddingMs);
          const originalEnd = new Date(ev.end.getTime() + eventPaddingMs);
          return slotInfo.start < originalEnd && slotInfo.end > originalStart;
        });
      }
      if (overlapsEvent) return;

      const appt: Appointment = {
        id: 0,
        barber_id: selectedBarberId,
        date: slotInfo.start.toISOString().slice(0, 10),
        start_time: slotInfo.start.toTimeString().slice(0, 5),
        end_time: slotInfo.end.toTimeString().slice(0, 5),
        client: '',
        phone: '',
        paid: false, price: 0,
        service_id: 1,
      };
      onSlotClick(appt, events);
    },
    [barbers, events, isClosedDay, isLunchBreak, onSlotClick, role, selectedBarberId]
  );

  const handleSelectEvent = useCallback(
    (ev: CalendarEvent) => {
      const sel = allAppointments?.find(a => a.id === ev.id);
      if (sel) onEventClick(sel);
    },
    [allAppointments, onEventClick]
  );

  const eventPropGetter = useCallback(
    (ev: CalendarEvent) => {
      let className = 'calendar-event--unpaid';
      if (role === 'guest') {
        className = 'calendar-event--unpaid calendar-event--guest';
      } else {
        if (!ev.isAppt) className = 'calendar-event--non-appointment';
        else if (!ev.paid) className = 'calendar-event--unpaid';
        else className = 'calendar-event--paid';
      }
      return { className };
    },
    [role]
  );

  const dayPropGetter = useCallback(
    (date: Date) =>
      isClosedDay(date)
        ? { className: 'rbc-disabled-day', style: { pointerEvents: 'none' as const } }
        : {},
    [isClosedDay]
  );

  const slotPropGetter = useCallback(
    (date: Date) => {
      const beforeOpen = businessHours.open_time ? date < setTimeOn(date, businessHours.open_time)! : false;
      const afterClose = businessHours.close_time ? date >= setTimeOn(date, businessHours.close_time)! : false;
      const lunch = isLunchBreak(date);
      const closedDay = isClosedDay(date);
      if (closedDay || beforeOpen || afterClose || lunch) {
        const className = lunch && !closedDay ? 'calendar-disabled-slot calendar-disabled-slot--break' : 'calendar-disabled-slot';
        return { className, style: { pointerEvents: 'none' as const } };
      }
      const now = new Date();
      const slotEnd = new Date(date.getTime() + step * 60 * 1000);
      const eventPaddingMs = 60 * 1000;

      let overlapsEvent = false;
      if (selectedBarberId === 0) {
        const busyBarberIds = new Set<number>();
        events.forEach(ev => {
          const originalStart = new Date(ev.start.getTime() - eventPaddingMs);
          const originalEnd = new Date(ev.end.getTime() + eventPaddingMs);
          if (date < originalEnd && slotEnd > originalStart) {
            if (ev.barber_id) {
              busyBarberIds.add(ev.barber_id);
            }
          }
        });
        const activeBarbers = barbers.filter(b => b.id && b.id !== 0);
        overlapsEvent = busyBarberIds.size >= activeBarbers.length;
      } else {
        overlapsEvent = events.some(ev => {
          const originalStart = new Date(ev.start.getTime() - eventPaddingMs);
          const originalEnd = new Date(ev.end.getTime() + eventPaddingMs);
          return date < originalEnd && slotEnd > originalStart;
        });
      }

      const isPastForGuest = role === 'guest' && date < now;
      if (!isPastForGuest && !overlapsEvent) {
        return { className: 'calendar-slot--clickable active:scale-[0.98] transition-transform duration-100' };
      }
      return {};
    },
    [barbers, businessHours.close_time, businessHours.open_time, events, isClosedDay, isLunchBreak, role, selectedBarberId, step]
  );

  if (!allAppointments) {
    return <CalendarSkeleton />;
  }

  return (
    <div className="space-y-4">
      {isMobile && (
        <div className="flex justify-center space-x-2">
          <DatePickerField date={currentDate} onChange={(d) => d && onNavigate(d)} displayButton />
        </div>
      )}

      <div className="custom-calendar p-6 rounded-lg">
        <Calendar
          localizer={localizer}
          events={selectedBarberId === 0 ? [] : events}
          components={{
            toolbar: CustomCalendarToolbar,
          }}
          view={currentView}
          views={availableViews}
          selectable
          popup={isMobile}
          longPressThreshold={0}
          step={step}
          timeslots={timeslots}
          min={calendarMin}
          max={calendarMax}
          drilldownView={null}
          showMultiDayTimes={false}
          tooltipAccessor={null}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          onRangeChange={onRangeChange}
          date={currentDate}
          onNavigate={onNavigate}
          eventPropGetter={eventPropGetter}
          dayPropGetter={dayPropGetter}
          slotPropGetter={slotPropGetter}
          messages={{ month: 'Month', week: 'Semana', day: 'Día', previous: 'Atrás', next: 'Siguiente', today: 'Hoy', date: 'Fecha', time: 'Hora', event: 'Turno', }}
          formats={formats}
        />
      </div>
    </div>
  );
}

const CustomCalendar = React.memo(CustomCalendarComponent);
export default CustomCalendar;
