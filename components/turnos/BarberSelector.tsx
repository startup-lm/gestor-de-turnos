"use client";

import { Barber } from "@/lib/types/Barbers";

type Props = {
  barbers: Barber[];
  selectedBarberId: number;
  onChange: (id: number) => void;
  className?: string;
  id?: string;
  disabled?: boolean;
};

export default function BarberSelector({ barbers, selectedBarberId, onChange, className = "", id, disabled = false }: Readonly<Props>) {
  return (
    <div className="flex justify-left w-full">
      <select
        id={id}
        disabled={disabled}
        className={`!px-4 !py-2.5 !border !border-[var(--foreground)]/10 !rounded-lg !shadow-sm !bg-[var(--foreground)]/5 !text-[var(--foreground)] focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all text-sm w-full h-[42px] ${disabled ? "!opacity-60 !cursor-not-allowed" : ""} ${className}`}
        value={selectedBarberId}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        required
      >
        <option 
          style={{ color: "grey" }}
          value={-1} disabled>
          Selecciona un barbero
        </option>

        {barbers.map((barber) => (
          <option
            style={{ color: "black" }}
            key={barber.id} value={barber.id}>
            {barber.name}
          </option>
        ))}

        {/* {role && (
          <option 
            style={{ color: "black" }}
            value={0}>
            {role === "guest" ? "No tengo preferencia" : "Todos"}
          </option>
        )} */}
      </select>
    </div>
  );
}
