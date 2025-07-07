"use client";

import React from "react";
import Image from "next/image";
import { Barber } from "@/lib/types/Barbers";

interface Props {
  barbers: Barber[];
  selectedBarberId: number | null;
  onChange: (id: number) => void;
}

export default function BarberCheckbox({barbers,selectedBarberId,onChange,}: Readonly<Props>) {
  return (
    <div className="flex flex-wrap justify-center gap-4">
      {barbers.map((b) => {
        const isSelected = b.id === selectedBarberId;
        return (
          <button key={b.id} type="button" onClick={() => onChange(b.id!)} 
            className={`w-36 h-30 justify-items-center barber-checkbox ${isSelected ? "selected" : ""} `} >
            <Image src={b.image || "/images/logo_hooligans.png"} alt={b.name} width={64} height={64} className="w-18 h-18 rounded-full object-cover mb-2 bg-[var(--background)]" />
            <span className="text-sm font-medium">{b.name}</span>
          </button>
        );
      })}
    </div>
  );
}