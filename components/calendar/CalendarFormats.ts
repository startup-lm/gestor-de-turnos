import { Formats } from 'react-big-calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const formats: Formats = {
  dayRangeHeaderFormat: (
    range: { start: Date; end: Date }
  ) => {
    const { start, end } = range;
    const sd = format(start, 'd', { locale: es });
    const ed = format(end,   'd', { locale: es });
    const mo = capitalize(format(start, 'MMMM', { locale: es }));
    return `Semana del ${sd} al ${ed} de ${mo}`;
  },
  dayHeaderFormat: (
    date: Date
  ) => capitalize(
    format(date, "EEEE d 'de' MMMM", { locale: es })
  ),
  dayFormat: (date: Date) =>
    capitalize(format(date, 'EEEE d', { locale: es })),
};
