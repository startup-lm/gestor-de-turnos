import React from "react";
import { ViewMode } from "@/lib/hooks/useDashboardData";

interface Props {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const options: { value: ViewMode; label: string }[] = [
  { value: "day",   label: "Diaria"  },
  { value: "week",  label: "Semanal" },
  { value: "month", label: "Mensual" },
];

export default function ViewModeChecklist({ viewMode, onChange }: Readonly<Props>) {
  return (
    <div className="segmented-control flex items-center">
      {options.map(({ value, label }) => {
        const isActive = viewMode === value;
        return (
          <button
            key={value}
            type="button"
            className={`segmented-control__item ${isActive ? "segmented-control__item--active" : ""}`}
            onClick={() => onChange(value)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

