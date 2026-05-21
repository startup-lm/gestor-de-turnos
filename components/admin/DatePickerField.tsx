import React from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import es  from "date-fns/locale/es";
import "react-datepicker/dist/react-datepicker.css";
import { CalendarDays } from "lucide-react";

registerLocale("es", es);

interface Props {
  date: Date | null;
  onChange: (date: Date | null) => void;
  displayButton?: boolean;
}

const ButtonInput = React.forwardRef<HTMLButtonElement,{ onClick?: () => void }>(({ onClick }, ref) => (
  <button type="button" ref={ref} onClick={onClick} className="px-4 py-2 mx-auto rounded-lg text-sm flex !bg-[var(--accent)]" >
    <CalendarDays className="w-5 h-5 mr-1" /> Seleccionar fecha
  </button>
));
ButtonInput.displayName = "ButtonInput";

export default function DatePickerField({date,onChange,displayButton = false,}: Readonly<Props>) {
  return (
    <DatePicker
      selected={date}
      onChange={onChange}
      locale="es"
      dateFormat="EEEE dd 'de' MMMM"
      placeholderText="Seleccionar fecha"
      className="!w-full !border !border-[var(--foreground)]/10 !rounded-lg !px-3 !py-2.5 !text-sm !bg-[var(--foreground)]/5 !text-[var(--foreground)] focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 !transition-all"
      calendarClassName="rounded-md shadow-sm"
      popperPlacement="bottom-start"
      customInput={displayButton ? <ButtonInput /> : undefined}
      wrapperClassName="w-full"
      required
    />
  );
}
