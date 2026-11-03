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

/**
 * Campos que el staff puede editar en un turno. Zod descarta cualquier otra clave
 * (deleted_at, arca_invoice_id, created_by...), así no se pueden pisar desde el navegador.
 */
export const AppointmentUpdatesSchema = z.object({
  client: z.string().trim().min(1, "El nombre del cliente es obligatorio").optional(),
  phone: z.string().optional(),
  barber_id: z.number().int().positive("Barbero inválido").optional(),
  service_id: z.number().int().positive("Servicio inválido").optional(),
  client_id: z.number().int().positive().nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}(T.*)?$/, "Formato de fecha inválido (YYYY-MM-DD)").optional(),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Formato de hora inválido (HH:mm)").optional(),
  end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Formato de hora inválido (HH:mm)").optional(),
  price: z.number().nonnegative("El precio no puede ser negativo").optional(),
  paid: z.boolean().optional(),
  payment_method: z.string().trim().max(50).nullable().optional(),
});

export const AppointmentPatchSchema = z.object({
  appointmentId: z.number().int().positive(),
  updates: AppointmentUpdatesSchema,
});

export const AppointmentDeleteSchema = z.object({
  id: z.number().int().positive(),
  deleted_by: z.string().optional(),
});

// --- Sales ---
// El total no se acepta del navegador: el servidor lo calcula como price × quantity
export const SaleInsertSchema = z.object({
  barber_id: z.number().int().positive("Elegí quién hizo la venta"),
  product_id: z.number().int().positive("Elegí un producto"),
  price: z.number().nonnegative("El precio no puede ser negativo"),
  quantity: z.number().int().positive("La cantidad debe ser mayor a cero"),
  details: z.string().trim().max(500).nullable().optional(),
});

export const SaleUpdateSchema = SaleInsertSchema.partial();

// --- Clients ---
export const ClientUpsertSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  phone: z.string().refine((val) => {
    return normalizePhone(val).isValid;
  }, { message: "Número de teléfono inválido" }),
});
