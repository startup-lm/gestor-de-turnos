import React from "react";
import { DateRange } from "react-date-range";
import es from "date-fns/locale/es";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

interface Props {
  startDate: Date;
  endDate: Date;
  onChange: (range: { startDate: Date; endDate: Date }) => void;
}

export default function DateRangeCalendar({ startDate, endDate, onChange }: Readonly<Props>) {
  return (
    <DateRange
      locale={es}
      weekStartsOn={1}
      ranges={[{ startDate, endDate, key: "selection" }]}
      onChange={(item) => onChange({ startDate: item.selection.startDate, endDate: item.selection.endDate }) }
      moveRangeOnFirstSelection={false}
      months={1}
      direction="horizontal"
      showDateDisplay={false}
      className="rounded-md shadow-sm"
      monthDisplayFormat="MMMM yyyy"
      rangeColors={["var(--primary)"]}  
    />
  );
}