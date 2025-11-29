import { useState } from 'react';
import { startOfWeek, endOfWeek } from 'date-fns';

export function useCalendarNavigation(initialDate: Date = new Date()) {
  const [currentDate, setCurrentDate] = useState<Date>(initialDate);
  const [currentRange, setCurrentRange] = useState<{ start: Date; end: Date }>(() => ({
    start: startOfWeek(initialDate, { weekStartsOn: 1 }),
    end: endOfWeek(initialDate, { weekStartsOn: 1 }),
  }));

  const onNavigate = (date: Date) => {
    setCurrentDate(date);
    setCurrentRange({
      start: startOfWeek(date, { weekStartsOn: 1 }),
      end: endOfWeek(date, { weekStartsOn: 1 }),
    });
  };

  const onRangeChange = (range: Date[] | { start: Date; end: Date }) => {
    const base = Array.isArray(range) ? range[0] : range.start;
    setCurrentRange({
      start: startOfWeek(base, { weekStartsOn: 1 }),
      end: endOfWeek(base, { weekStartsOn: 1 }),
    });
  };

  return { currentDate, currentRange, onNavigate, onRangeChange };
}
