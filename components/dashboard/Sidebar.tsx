"use client";

import React, { useState } from "react";
import BarberSelector from "@/components/turnos/BarberSelector";
import { Barber } from "@/lib/types/Barbers";
import DateRangeCalendar from "./DateRangeCalendar";

interface SidebarProps {
  barbers: Barber[];
  selectedBarberId: number;
  onBarberChange: (id: number) => void;
  startDate: Date;
  endDate: Date;
  onDateChange: (range: { startDate: Date; endDate: Date }) => void;
}

export default function Sidebar({barbers,selectedBarberId,onBarberChange,startDate,endDate,onDateChange,}: Readonly<SidebarProps>) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="relative">

      <button onClick={() => setIsOpen(!isOpen)} className="absolute top-2 right-2 text-xl px-2 py-1 rounded !bg-[var(--primary)] hover:bg-[var(--secondary)] hover:text-black !text-black transition z-10 hidden md:block" >
        {isOpen ? "←" : "☰"}
      </button>

      {isOpen && (
        <div className="bg-[var(--bg-carousel)] p-4 rounded-md shadow-sm text-sm space-y-10">
          <div>
            <label className="font-medium mb-2 block mt-4">Barbero:</label>
            <BarberSelector
              barbers={barbers}
              selectedBarberId={selectedBarberId}
              onChange={onBarberChange}
            />
          </div>
          <div>
            <label className="font-medium mb-2 block">Fechas:</label>
            <DateRangeCalendar
              startDate={startDate}
              endDate={endDate}
              onChange={onDateChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}