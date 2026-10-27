import { z } from "zod";
import { normalizePhone } from "@/utils/phone";

// --- Appointments ---
export const AppointmentInsertSchema = z.object({
  client: z.string().min(1, "El nombre del cliente es obligatorio"),
  barber_id: z.number().int().positive("Barbero inválido"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}(T.*)?$/, "Formato de fecha inválido (YYYY-MM-DD)"),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido (HH:mm)"),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido (HH:mm)"),
  phone: z.string().optional().refine((val) => {
    if (!val || val === "0000000000") return true;
    return normalizePhone(val).isValid;
  }, { message: "Número de teléfono inválido" }),
  service_id: z.number().int().positive("Servicio inválido"),
  created_by: z.string().optional(),
  client_id: z.number().int().positive().optional().nullable(),
  type: z.enum(["appointment", "block"]).optional().default("appointment"),
});

export const AppointmentPutSchema = z.object({
  appointmentId: z.number().int().positive(),
  isPaid: z.boolean(),
  price: z.number().nonnegative(),
  payment_method: z.enum(["Efectivo", "MercadoPago"]).optional().nullable(),
});

export const AppointmentPatchSchema = z.object({
  appointmentId: z.number().int().positive(),
  updates: z.record(z.string(), z.any()), // Permite enviar un objeto de actualizaciones dinámico
});

export const AppointmentDeleteSchema = z.object({
  id: z.number().int().positive(),
  deleted_by: z.string().optional(),
});

// --- Clients ---
export const ClientUpsertSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  phone: z.string().refine((val) => {
    return normalizePhone(val).isValid;
  }, { message: "Número de teléfono inválido" }),
});
