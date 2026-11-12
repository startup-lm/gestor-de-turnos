"use client";

import React from "react";
import InlineConfirm from "@/components/ui/InlineConfirm";
import { Trash2, Save, Loader2 } from "lucide-react";

interface AppointmentActionsSectionProps {
  isDeleteDisabled: boolean;
  loading: boolean;
  isBlockedRange: boolean;
  isLocked: boolean;
  isPaid: boolean;
  hasChanges: boolean;
  loadingUpdate: boolean;
  confirmDelete: boolean;
  setConfirmDelete: (c: boolean) => void;
  onDeleteConfirm: () => Promise<void>;
}

export function AppointmentActionsSection({
  isDeleteDisabled,
  loading,
  isBlockedRange,
  isLocked,
  isPaid,
  hasChanges,
  loadingUpdate,
  confirmDelete,
  setConfirmDelete,
  onDeleteConfirm,
}: AppointmentActionsSectionProps) {
  return (
    <div className="pt-2 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          id="btn-appt-delete"
          aria-label="Eliminar"
          disabled={isDeleteDisabled || loading}
          onClick={() => setConfirmDelete(true)}
          title={
            isLocked
              ? "Este turno tiene comprobante fiscal: no se puede modificar."
              : isPaid
              ? "No se puede eliminar un turno que ya fue cobrado"
              : undefined
          }
          className="w-full flex items-center justify-center gap-2 border border-red-500/30 hover:border-red-500/60 text-red-400 hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed font-bold py-2.5 px-3 rounded-xl transition-all text-xs active:scale-95 cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          <span>{isBlockedRange ? "Desbloquear" : "Eliminar"}</span>
        </button>

        <button
          type="submit"
          id="btn-appt-save"
          aria-label="Guardar cambios"
          disabled={!hasChanges || loadingUpdate || isLocked}
          title={
            isLocked
              ? "Este turno tiene comprobante fiscal: no se puede modificar."
              : undefined
          }
          className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all text-xs font-black active:scale-95 ${
            hasChanges && !loadingUpdate && !isLocked
              ? "!bg-[var(--accent)] hover:!bg-[var(--accent-hover)] !text-slate-950 shadow-md shadow-[var(--accent)]/20 cursor-pointer animate-pulse"
              : "!bg-[var(--foreground)]/5 !text-[var(--foreground)]/30 border border-[var(--foreground)]/10 cursor-not-allowed"
          }`}
        >
          {loadingUpdate ? (
            <Loader2 className="w-4 h-4 animate-spin text-inherit" />
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{hasChanges ? "Guardar cambios" : "Sin cambios"}</span>
            </>
          )}
        </button>
      </div>

      {confirmDelete && (
        <InlineConfirm
          message={
            isBlockedRange
              ? "¿Desbloquear este horario? El horario volverá a quedar disponible para reservas en la agenda pública."
              : "¿Eliminar este turno? Esta acción no se puede deshacer y el horario quedará libre para otros clientes."
          }
          confirmText={isBlockedRange ? "Desbloquear" : "Eliminar"}
          cancelText="Cancelar"
          onConfirm={onDeleteConfirm}
          onCancel={() => setConfirmDelete(false)}
          loading={loading}
        />
      )}

      {isLocked ? (
        <p className="text-[11px] text-amber-400/90 text-center font-medium mt-2">
          Este turno tiene comprobante fiscal: no se puede modificar.
        </p>
      ) : isDeleteDisabled ? (
        <p className="text-[11px] text-amber-400/90 text-center font-medium mt-2">
          Este turno ya fue cobrado y no puede ser eliminado.
        </p>
      ) : null}
    </div>
  );
}
