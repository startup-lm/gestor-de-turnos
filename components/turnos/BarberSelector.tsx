"use client";

import { Barber } from "@/lib/types/Barbers";

type Props = {
  barbers: Barber[];
  selectedBarberId: number;
  onChange: (id: number) => void;
  className?: string;
  id?: string;
};

export default function BarberSelector({ barbers, selectedBarberId, onChange, className = "", id }: Readonly<Props>) {
  return (
    <div className="mb-6 flex justify-left">
      <select
        id={id}
        className={`px-4 py-2 border rounded shadow-sm ${className}`}
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
