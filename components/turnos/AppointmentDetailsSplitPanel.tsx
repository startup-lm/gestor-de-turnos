"use client";

import { useRef } from "react";
import { format } from "date-fns";
import { Appointment } from "@/lib/types/Appointment";
import PopupModal from "@/components/ui/PopupModal";
import dynamic from "next/dynamic";
import ConfirmModal from "../ui/ConfirmModal";
import DeleteButton from "../buttons/DeleteButton";
import ChargeButton from "../buttons/ChargeButton";
import SaveButton from "../buttons/SaveButton";
import BarberSelector from "./BarberSelector";
import { Barber } from "@/lib/types/Barbers";
import DatePickerField from "../admin/DatePickerField";
import TimeSelect from "../admin/TimeSelect";
import { generateAllAppointments } from "@/utils/appointments";
import Spinner from "../loading/Spinner";
import ClientAutocompleteFields from "./ClientAutocompleteFields";
import { useBusinessContext } from "@/lib/context/BusinessContext";
import { useAppointmentDetailsLogic } from "@/lib/hooks/useAppointmentDetailsLogic";
import { Receipt, X, CheckCircle, Clock } from "lucide-react";

const ServicePaidModal = dynamic(() => import("./ServicePaidModal"), { ssr: false, loading: () => null });

interface Props {
  onClose: () => void;
  appointment: Appointment;
  barbers: Barber[];
  onAppointmentChanged?: () => void;
  isMobileModal?: boolean;
}

export default function AppointmentDetailsSplitPanel({
  onClose,
  appointment,
  barbers,
  onAppointmentChanged,
}: Readonly<Props>) {
  const { businessHours, businessSettings, isEnabled } = useBusinessContext();
  const ARCA_ENABLED = isEnabled("arca");
  const hasPaidRef = useRef(false);
  const allAppointments = generateAllAppointments({
    openTime: businessHours.open_time,
    closeTime: businessHours.close_time,
    stepMinutes: businessSettings.slot_step_minutes,
    breakStart: businessHours.lunch_start,
    breakEnd: businessHours.lunch_end,
  });

  const {
    loadingFetch,
    services,
    showService,
    setShowService,
    confirmModal,
    setConfirmModal,
    loading,
    loadingUpdate,
    popup,
    selectedBarberId,
    setSelectedBarberId,
    date,
    setDate,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    client,
    setClient,
    phone,
    setPhone,
    selectedServiceId,
    setSelectedServiceId,
    price,
    setPrice,
    isBlockedRange,
    hasChanges,
    handleDelete,
    handleUpdate,
  } = useAppointmentDetailsLogic(appointment, barbers);

  if (loadingFetch) {
    return (
      <div className="bg-[var(--bg-carousel)] border border-[var(--foreground)]/10 rounded-3xl p-6 shadow-2xl flex items-center justify-center min-h-[300px]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-carousel)] border border-[var(--foreground)]/10 rounded-3xl p-5 md:p-6 shadow-2xl flex flex-col justify-between h-full text-left overflow-y-auto">
      <div className="space-y-5">
        {/* Header con botón cerrar */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--foreground)]/10">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] block">
              Detalle del Turno
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <h3 className="text-xl font-extrabold text-[var(--foreground)] tracking-tight">
                Turno #{appointment.id}
              </h3>
              {appointment.paid ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  <CheckCircle className="w-3 h-3" />
                  Cobrado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  <Clock className="w-3 h-3" />
                  Pendiente
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel de detalle"
            className="p-1.5 rounded-full bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10 text-[var(--foreground)]/60 hover:text-[var(--foreground)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Metadatos (Actualización y ARCA) */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          {appointment.updated_at ? (
            <span className="text-[11px] text-[var(--foreground)]/50">
              Modificado: {format(new Date(appointment.updated_at), "dd/MM/yyyy HH:mm")}
            </span>
          ) : (
            <span className="text-[11px] text-[var(--foreground)]/50">
              Turno registrado
            </span>
          )}

          {ARCA_ENABLED && appointment.arca_invoice_id && (
            <div className="flex items-center gap-1 text-[11px] text-green-300 font-medium px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded-full">
              <Receipt className="w-3 h-3 text-green-400 shrink-0" />
              <span>Comprobante emitido</span>
            </div>
          )}
        </div>

        {/* Formulario de Edición */}
        <form id="form-appointment-detail-split" onSubmit={handleUpdate} className="space-y-4">
          {isBlockedRange ? (
            <div className="space-y-3.5">
              <div>
                <label
                  htmlFor="appt-barber"
                  className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5"
                >
                  Barbero
                </label>
                <BarberSelector
                  id="appt-barber"
                  barbers={barbers ?? []}
                  selectedBarberId={selectedBarberId}
                  onChange={setSelectedBarberId}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Día
                </label>
                <DatePickerField date={date} onChange={setDate} />
              </div>
              <div className="grid grid-cols-2 gap-3">
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
              <div>
                <label
                  htmlFor="appt-blocked-reason"
                  className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5"
                >
                  Motivo de bloqueo
                </label>
                <input
                  id="appt-blocked-reason"
                  type="text"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  className="!bg-[var(--background)] !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-xl p-2.5 w-full block text-sm shadow-inner"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              {/* Barbero */}
              <div>
                <label
                  htmlFor="appt-barber"
                  className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5"
                >
                  Barbero
                </label>
                <BarberSelector
                  id="appt-barber"
                  barbers={barbers ?? []}
                  selectedBarberId={selectedBarberId}
                  onChange={setSelectedBarberId}
                  className="w-full"
                />
              </div>

              {/* Día y Horario de Inicio */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Día y Horario
                </label>
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
                      selectClassName="!h-[42px]"
                    />
                  </div>
                </div>
              </div>

              {/* Servicio */}
              <div>
                <label
                  htmlFor="appt-service"
                  className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5"
                >
                  Servicio
                </label>
                <select
                  id="appt-service"
                  required
                  className="!bg-[var(--background)] !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-xl p-2.5 w-full block text-sm h-[42px] shadow-inner cursor-pointer"
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(Number(e.target.value))}
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
              </div>

              {/* Cliente y Celular */}
              <div>
                <ClientAutocompleteFields
                  name={client}
                  phone={phone}
                  onNameChange={setClient}
                  onPhoneChange={setPhone}
                  onClientResolved={() => {}}
                  showWhatsapp
                />
              </div>

              {/* Precio cobrado (si ya está pagado) */}
              {appointment.paid && (
                <div>
                  <label
                    htmlFor="appt-price"
                    className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5"
                  >
                    Monto Cobrado ($)
                  </label>
                  <input
                    id="appt-price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="!bg-[var(--background)] !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-xl p-2.5 w-full block text-sm shadow-inner"
                  />
                </div>
              )}
            </div>
          )}

          {/* Botón Cobrar si el turno aún no fue cobrado */}
          {!appointment.paid && !isBlockedRange && (
            <div className="pt-2">
              <ChargeButton
                id="btn-appt-charge"
                onClick={() => setShowService(true)}
                disabled={appointment.paid || isBlockedRange}
                loading={loading}
                isPaid={appointment.paid}
                className="w-full justify-center !py-3"
              />
            </div>
          )}

          {/* Botones de Acción: Eliminar y Guardar */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <DeleteButton
              id="btn-appt-delete"
              disabled={appointment.paid}
              loading={loading}
              onClick={() => setConfirmModal(true)}
              className="w-full justify-center"
            />
            <SaveButton
              id="btn-appt-save"
              type="submit"
              disabled={!hasChanges}
              loading={loadingUpdate}
              className="w-full justify-center"
            />
          </div>
        </form>
      </div>

      {popup.show && (
        <PopupModal
          message={popup.message}
          success={popup.success}
          onClose={() => {
            popup.close();
            if (popup.success) {
              onClose();
              onAppointmentChanged?.();
            }
          }}
        />
      )}

      {showService && (
        <ServicePaidModal
          appointment={appointment}
          setIsPaid={(paid) => {
            if (paid) {
              hasPaidRef.current = true;
            }
          }}
          onClose={() => {
            setShowService(false);
            if (hasPaidRef.current) {
              onClose();
              onAppointmentChanged?.();
            }
          }}
        />
      )}

      {confirmModal && (
        <ConfirmModal
          title={"¿Estás seguro que querés eliminar el turno?"}
          onConfirm={async () => {
            await handleDelete();
            onAppointmentChanged?.();
          }}
          onCancel={() => setConfirmModal(false)}
          loading={loading}
          button="delete"
        />
      )}
    </div>
  );
}
