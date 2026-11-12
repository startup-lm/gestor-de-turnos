"use client";

import React from "react";
import Image from "next/image";
import logo from "@/public/images/logo.png";
import BarberSelector from "../BarberSelector";
import DatePickerField from "../../admin/DatePickerField";
import TimeSelect from "../../admin/TimeSelect";
import type { Barber } from "@/lib/types/Barbers";
import type { Service } from "@/lib/types/Services";
import { Scissors, AlertCircle, Calendar } from "lucide-react";

interface AppointmentSummarySectionProps {
  isBlockedRange: boolean;
  currentService: Service | null;
  isValidServiceImage: boolean;
  isEditingService: boolean;
  setIsEditingService: (v: boolean) => void;
  services: Service[];
  selectedServiceId: number;
  setSelectedServiceId: (id: number) => void;
  duration: number;
  isLocked: boolean;
  currentBarber: Barber | null;
  isValidBarberImage: boolean;
  barberImage?: string | null;
  isEditingBarber: boolean;
  setIsEditingBarber: (v: boolean) => void;
  barbers: Barber[];
  selectedBarberId: number;
  setSelectedBarberId: (id: number) => void;
  isEditingDateTime: boolean;
  setIsEditingDateTime: (v: boolean) => void;
  date: Date | null;
  setDate: (d: Date | null) => void;
  startTime: string;
  setStartTime: (t: string) => void;
  endTime: string;
  setEndTime: (t: string) => void;
  calculatedEndTime: string;
  allAppointments: string[];
  formattedDate: string;
}

export function AppointmentSummarySection({
  isBlockedRange,
  currentService,
  isValidServiceImage,
  isEditingService,
  setIsEditingService,
  services,
  selectedServiceId,
  setSelectedServiceId,
  duration,
  isLocked,
  currentBarber,
  isValidBarberImage,
  barberImage,
  isEditingBarber,
  setIsEditingBarber,
  barbers,
  selectedBarberId,
  setSelectedBarberId,
  isEditingDateTime,
  setIsEditingDateTime,
  date,
  setDate,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  calculatedEndTime,
  allAppointments,
  formattedDate,
}: AppointmentSummarySectionProps) {
  return (
    <>
      {/* Resumen del turno (Estilo idéntico a la reserva) */}
      <div className="bg-[var(--background)]/60 border border-[var(--foreground)]/10 rounded-2xl p-4 md:p-5 space-y-4 shadow-inner">
        {/* Tarjeta de Servicio */}
        {!isBlockedRange && (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              {currentService ? (
                <div className="relative w-12 h-12 rounded-2xl overflow-hidden shrink-0 border border-[var(--accent)]/30 bg-[var(--background)] shadow-md">
                  <Image
                    src={isValidServiceImage && currentService.image ? currentService.image : logo}
                    alt={currentService.name}
                    fill
                    sizes="48px"
                    className="object-cover bg-[var(--background)]"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-md">
                  <Scissors className="w-5 h-5" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <span className="block text-[11px] font-bold text-[var(--foreground)]/50 tracking-wider">
                  Servicio
                </span>

                {isEditingService ? (
                  <div className="space-y-1.5 mt-1">
                    <select
                      id="appt-service"
                      required
                      className="!bg-[var(--background)] !text-[var(--foreground)] !border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)] transition-all rounded-xl p-2 w-full block text-sm shadow-inner cursor-pointer"
                      value={selectedServiceId}
                      onChange={(e) => {
                        setSelectedServiceId(Number(e.target.value));
                        setIsEditingService(false);
                      }}
                      autoFocus
                    >
                      <option value={-1} disabled style={{ color: "grey" }}>
                        Selecciona un servicio
                      </option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id} style={{ color: "black" }}>
                          {s.name} (${s.price?.toLocaleString("es-AR")} · {s.duration} min)
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setIsEditingService(false)}
                      className="text-[11px] font-semibold text-[var(--accent)] hover:underline inline-block"
                    >
                      Cerrar selección
                    </button>
                  </div>
                ) : (
                  <>
                    {currentService ? (
                      <>
                        <span className="font-extrabold text-base text-[var(--foreground)] truncate block leading-tight">
                          {currentService.name}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-black text-[var(--accent)]">
                            ${currentService.price?.toLocaleString("es-AR")}
                          </span>
                          <span className="text-[11px] text-[var(--foreground)]/60 font-semibold bg-[var(--foreground)]/5 px-2 py-0.5 rounded-md border border-[var(--foreground)]/10">
                            {duration} min
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Sin servicio asignado
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {!isEditingService && !isLocked && (
              <button
                type="button"
                onClick={() => setIsEditingService(true)}
                className="text-xs font-bold text-[var(--accent)] hover:underline shrink-0 px-2.5 py-1.5 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 hover:bg-[var(--accent)]/20 transition-all"
              >
                Cambiar
              </button>
            )}
          </div>
        )}

        {/* Tarjeta de Profesional */}
        <div
          className={`flex items-center justify-between gap-3 ${
            !isBlockedRange ? "pt-4 border-t border-[var(--foreground)]/10" : ""
          }`}
        >
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden shrink-0 border border-[var(--accent)]/30 bg-[var(--background)] shadow-md">
              <Image
                src={isValidBarberImage && barberImage ? barberImage : logo}
                alt={currentBarber?.name || "Profesional"}
                fill
                sizes="48px"
                className="object-cover bg-[var(--background)]"
              />
            </div>

            <div className="min-w-0 flex-1">
              <span className="block text-[11px] font-bold text-[var(--foreground)]/50 tracking-wider">
                Profesional
              </span>

              {isEditingBarber ? (
                <div className="space-y-1.5 mt-1">
                  <BarberSelector
                    id="appt-barber"
                    barbers={barbers?.filter((b) => b.active !== false) ?? []}
                    selectedBarberId={selectedBarberId}
                    onChange={(id) => {
                      setSelectedBarberId(id);
                      setIsEditingBarber(false);
                    }}
                    className="w-full !h-[38px] !py-1 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setIsEditingBarber(false)}
                    className="text-[11px] font-semibold text-[var(--accent)] hover:underline inline-block"
                  >
                    Cerrar selección
                  </button>
                </div>
              ) : (
                <>
                  <span className="font-extrabold text-base text-[var(--foreground)] truncate block leading-tight">
                    {currentBarber?.name || "Sin barbero asignado"}
                  </span>
                  <span className="text-[11px] text-[var(--foreground)]/60 font-medium block mt-0.5">
                    {currentBarber?.role === "admin"
                      ? "Administrador / barbero"
                      : "Barbero profesional"}
                  </span>
                </>
              )}
            </div>
          </div>

          {!isEditingBarber && !isLocked && (
            <button
              type="button"
              onClick={() => setIsEditingBarber(true)}
              className="text-xs font-bold text-[var(--accent)] hover:underline shrink-0 px-2.5 py-1.5 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 hover:bg-[var(--accent)]/20 transition-all"
            >
              Cambiar
            </button>
          )}
        </div>

        {/* Tarjeta de Fecha y horario */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-[var(--foreground)]/10">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)] shrink-0 shadow-md">
              <Calendar className="w-5 h-5" />
            </div>

            <div className="min-w-0 flex-1">
              <span className="block text-[11px] font-bold text-[var(--foreground)]/50 tracking-wider">
                Fecha y horario
              </span>

              {isEditingDateTime ? (
                <div className="space-y-2 mt-1">
                  {isBlockedRange ? (
                    <div className="space-y-2">
                      <DatePickerField date={date} onChange={setDate} />
                      <div className="grid grid-cols-2 gap-2">
                        <TimeSelect
                          id="appt-blocked-start-time"
                          label="Inicio"
                          value={startTime}
                          options={allAppointments}
                          onChange={setStartTime}
                        />
                        <TimeSelect
                          id="appt-blocked-end-time"
                          label="Fin"
                          value={endTime}
                          options={allAppointments.filter((t) => t > startTime)}
                          onChange={setEndTime}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <DatePickerField date={date} onChange={setDate} />
                      </div>
                      <div className="w-[110px] shrink-0">
                        <TimeSelect
                          id="appt-start-time"
                          label=""
                          value={startTime}
                          options={allAppointments}
                          onChange={setStartTime}
                          className="h-full"
                          selectClassName="!h-[42px] text-sm"
                        />
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsEditingDateTime(false)}
                    className="text-[11px] font-semibold text-[var(--accent)] hover:underline inline-block"
                  >
                    Listo
                  </button>
                </div>
              ) : (
                <>
                  <span className="font-extrabold text-base text-[var(--foreground)] block leading-tight">
                    {formattedDate}
                  </span>
                  <span className="block text-sm font-black text-[var(--accent)] mt-0.5">
                    {isBlockedRange
                      ? `${startTime} a ${endTime} hs`
                      : `${startTime} a ${calculatedEndTime} hs (${duration} min)`}
                  </span>
                </>
              )}
            </div>
          </div>

          {!isEditingDateTime && !isLocked && (
            <button
              type="button"
              onClick={() => setIsEditingDateTime(true)}
              className="text-xs font-bold text-[var(--accent)] hover:underline shrink-0 px-2.5 py-1.5 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 hover:bg-[var(--accent)]/20 transition-all"
            >
              Cambiar
            </button>
          )}
        </div>
      </div>

      <p className="text-[11px] text-[var(--foreground)]/50 italic text-center py-0.5">
        💡 Podés tocar en Cambiar para modificar el servicio, barbero o fecha y horario.
      </p>
    </>
  );
}
