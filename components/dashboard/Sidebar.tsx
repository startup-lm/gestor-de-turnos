"use client";

import React, { useState } from "react";
import { Barber } from "@/lib/types/Barbers";
import DateRangeCalendar from "./DateRangeCalendar";
import { ChevronDown, Calendar, User } from "lucide-react";

interface SidebarProps {
  barbers: Barber[];
  selectedBarberId: number;
  onBarberChange: (id: number) => void;
  startDate: Date;
  endDate: Date;
  onDateChange: (range: { startDate: Date; endDate: Date }) => void;
  showAll?: boolean;
}

export default function Sidebar({
  barbers,
  selectedBarberId,
  onBarberChange,
  startDate,
  endDate,
  onDateChange,
  showAll = false
}: Readonly<SidebarProps>) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute top-4 right-4 text-sm px-3 py-2 rounded-xl !bg-[var(--accent)] hover:scale-105 active:scale-95 !text-[var(--primary)] font-bold transition-all z-10 hidden md:block shadow-lg"
      >
        {isOpen ? "Ocultar Filtros ←" : "Filtros ☰"}
      </button>

      {isOpen && (
        <div className="dashboard-card p-6 text-sm space-y-8 w-full md:w-[300px]">
          {/* Selector de Barbero */}
          <div>
            <label className="font-bold mb-2 block uppercase text-[10px] text-slate-400 tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[var(--accent)]" />
              Barbero:
            </label>
            <div className="relative premium-select-wrapper mt-1">
              <select
                id="dashboard-barber"
                className="premium-select w-full"
                value={selectedBarberId}
                onChange={(e) => onBarberChange(parseInt(e.target.value, 10))}
              >
                {showAll && (
                  <option value={0} style={{ color: "black" }}>
                    Todos los Barberos
                  </option>
                )}
                {barbers.map((barber) => (
                  <option key={barber.id} value={barber.id} style={{ color: "black" }}>
                    {barber.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Rango de Fechas */}
          <div>
            <label className="font-bold mb-3 block uppercase text-[10px] text-slate-400 tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[var(--accent)]" />
              Fechas:
            </label>
            <div className="rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-950/20 p-2 shadow-inner">
              <DateRangeCalendar
                startDate={startDate}
                endDate={endDate}
                onChange={onDateChange}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}