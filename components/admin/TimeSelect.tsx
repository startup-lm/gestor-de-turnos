import React from "react";

interface TimeSelectProps {
  label?: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  className?: string;
  selectClassName?: string;
}

export default function TimeSelect({ label, value, options, onChange, className = "", selectClassName = "" }: Readonly<TimeSelectProps>) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium mb-1">
          {label}
        </label>
      )}
      <select
        className={`w-full border rounded px-3 py-2 text-sm ${selectClassName}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      >
        <option value="" style={{ color: "grey" }}>Seleccionar</option>
        {options.map((t) => (
          <option key={t} value={t} style={{ color: "black" }}>
            {t}
          </option>
        ))}
      </select>
    </div>
  );
}
