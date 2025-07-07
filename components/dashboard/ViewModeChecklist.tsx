import React from "react";
import { ViewMode } from "@/lib/hooks/useDashboardData";
import { Check } from "lucide-react";

interface Props {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const options: { value: ViewMode; label: string }[] = [
  { value: "day",   label: "Diaria"    },
  { value: "week",  label: "Semanal" },
  { value: "month", label: "Mensual"    },
];

export default function ViewModeChecklist({ viewMode, onChange }: Readonly<Props>) {
  return (
    <ul className="flex flex-col space-y-2 md:flex-row md:space-x-4 md:space-y-0 items-center">
      {options.map(({ value, label }) => (
        <li key={value} className="flex items-center gap-2 cursor-pointer" onClick={() => onChange(value)} >
          <span className={`w-4 h-4 flex-shrink-0 border rounded  
            ${viewMode === value ? "bg-[var(--primary)] border-[var(--primary)]" : "bg-transparent border-gray-500"}`}
          >
            {viewMode === value && <Check size={12} className="text-white" />}
          </span>
          <span className="select-none">{label}</span>
        </li>
      ))}
    </ul>
  );
}
