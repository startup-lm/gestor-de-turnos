"use client";

import React, { useState } from "react";
import { Barber } from "@/lib/types/Barbers";
import DateRangeCalendar from "./DateRangeCalendar";


interface SidebarProps {
  barbers: Barber[];
  selectedBarberId: number;
  onBarberChange: (id: number) => void;
  startDate: Date;
  endDate: Date;
  onDateChange: (range: { startDate: Date; endDate: Date }) => void;
  showAll?: boolean;
}

export default function Sidebar({barbers,selectedBarberId,onBarberChange,startDate,endDate,onDateChange,showAll=false}: Readonly<SidebarProps>) {
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
            <div className="mb-6 flex justify-left">
              <select
                id="dashboard-barber"
                className="px-4 py-2 border rounded shadow-sm w-full"
                value={selectedBarberId}
                onChange={(e) => onBarberChange(parseInt(e.target.value, 10))}
              >
                {showAll && (
                  <option value={0}>Todos los Barberos</option>
                )}
                {barbers.map((barber) => (
                  <option key={barber.id} value={barber.id} style={{ color: 'black' }}>
                    {barber.name}
                  </option>
                ))}
              </select>
            </div>
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