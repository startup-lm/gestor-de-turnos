import React from "react";

interface TimeSelectProps {
  label?: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  className?: string;
  selectClassName?: string;
  id?: string;
}

export default function TimeSelect({ label, value, options, onChange, className = "", selectClassName = "", id }: Readonly<TimeSelectProps>) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-semibold text-[var(--accent)] tracking-wider mb-1.5">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`!w-full !border !border-[var(--foreground)]/10 !rounded-lg !px-3 !py-2.5 !text-sm !bg-[var(--foreground)]/5 !text-[var(--foreground)] focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 !transition-all h-[42px] ${selectClassName}`}
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
