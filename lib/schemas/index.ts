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
}).refine(
  // Sin medio de pago, el cobro no se puede ubicar en la caja
  (updates) => updates.paid !== true || !!updates.payment_method,
  { message: "Elegí un medio de pago", path: ["payment_method"] }
);

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
  payment_method: z.string({ error: "Elegí un medio de pago" }).trim().min(1, "Elegí un medio de pago").max(50),
});

export const SaleUpdateSchema = SaleInsertSchema.partial();

// --- Clients ---
export const ClientUpsertSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  phone: z.string().refine((val) => {
    return normalizePhone(val).isValid;
  }, { message: "Número de teléfono inválido" }),
});

// --- Barbers ---
export const BarberInsertSchema = z.object({
  email: z.string({ error: "El email es obligatorio" }).trim().toLowerCase().email("Email inválido"),
  name: z.string({ error: "El nombre es obligatorio" }).trim().min(1, "El nombre es obligatorio").max(120, "El nombre es demasiado largo"),
  image: z.string().trim().max(1000).nullable().optional(),
  instagram: z.string().trim().max(120).nullable().optional(),
  role: z.enum(["admin", "barber"]).optional().default("barber"),
  commission: z.number().min(0, "La comisión no puede ser negativa").max(100, "La comisión no puede superar el 100%").optional(),
  sale_commission: z.number().min(0, "La comisión no puede ser negativa").max(100, "La comisión no puede superar el 100%").optional(),
  active: z.boolean().optional(),
});

export const BarberUpdateSchema = z.object({
  id: z.number({ error: "ID inválido" }).int().positive("ID inválido"),
  email: z.string().trim().toLowerCase().email("Email inválido").optional(),
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120, "El nombre es demasiado largo").optional(),
  image: z.string().trim().max(1000).nullable().optional(),
  instagram: z.string().trim().max(120).nullable().optional(),
  role: z.enum(["admin", "barber"]).optional(),
  commission: z.number().min(0, "La comisión no puede ser negativa").max(100, "La comisión no puede superar el 100%").optional(),
  sale_commission: z.number().min(0, "La comisión no puede ser negativa").max(100, "La comisión no puede superar el 100%").optional(),
  active: z.boolean().optional(),
});

export const BarberDeleteSchema = z.object({
  id: z.number({ error: "ID inválido" }).int().positive("ID inválido"),
});

// --- Products ---
export const ProductInsertSchema = z.object({
  name: z.string({ error: "El nombre es obligatorio" }).trim().min(1, "El nombre es obligatorio").max(120, "El nombre es demasiado largo"),
  description: z.string().trim().max(1000, "La descripción es demasiado larga").nullable().optional().default(""),
  price: z.number({ error: "El precio es obligatorio" }).nonnegative("El precio no puede ser negativo"),
  image: z.string().trim().max(1000).nullable().optional(),
  stock: z.number().int("El stock debe ser un número entero").nonnegative("El stock no puede ser negativo").optional().default(0),
});

export const ProductUpdateSchema = z.object({
  id: z.number({ error: "ID inválido" }).int().positive("ID inválido"),
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120, "El nombre es demasiado largo").optional(),
  description: z.string().trim().max(1000, "La descripción es demasiado larga").nullable().optional(),
  price: z.number().nonnegative("El precio no puede ser negativo").optional(),
  image: z.string().trim().max(1000).nullable().optional(),
  stock: z.number().int("El stock debe ser un número entero").nonnegative("El stock no puede ser negativo").optional(),
});

export const ProductDeleteSchema = z.object({
  id: z.number({ error: "ID inválido" }).int().positive("ID inválido"),
});

// --- Services ---
export const ServiceInsertSchema = z.object({
  name: z.string({ error: "El nombre es obligatorio" }).trim().min(1, "El nombre es obligatorio").max(120, "El nombre es demasiado largo"),
  description: z.string().trim().max(1000, "La descripción es demasiado larga").nullable().optional().default(""),
  price: z.number({ error: "El precio es obligatorio" }).nonnegative("El precio no puede ser negativo"),
  image: z.string().trim().max(1000).nullable().optional(),
  duration: z.number().int("La duración debe ser un número entero").positive("La duración debe ser mayor a cero").optional().default(30),
});

export const ServiceUpdateSchema = z.object({
  id: z.number({ error: "ID inválido" }).int().positive("ID inválido"),
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120, "El nombre es demasiado largo").optional(),
  description: z.string().trim().max(1000, "La descripción es demasiado larga").nullable().optional(),
  price: z.number().nonnegative("El precio no puede ser negativo").optional(),
  image: z.string().trim().max(1000).nullable().optional(),
  duration: z.number().int("La duración debe ser un número entero").positive("La duración debe ser mayor a cero").optional(),
});

export const ServiceDeleteSchema = z.object({
  id: z.number({ error: "ID inválido" }).int().positive("ID inválido"),
});

// --- Business Hours ---
const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;
export const BusinessHoursUpdateSchema = z.object({
  open_time: z.string({ error: "Formato de hora inválido" }).regex(timeRegex, "Formato de hora inválido (HH:mm)"),
  close_time: z.string({ error: "Formato de hora inválido" }).regex(timeRegex, "Formato de hora inválido (HH:mm)"),
  lunch_start: z.string().regex(timeRegex, "Formato de hora inválido (HH:mm)").nullable().optional(),
  lunch_end: z.string().regex(timeRegex, "Formato de hora inválido (HH:mm)").nullable().optional(),
  closed_days: z.array(z.number().int().min(0, "Día cerrado inválido").max(6, "Día cerrado inválido")),
});

// --- Auth ---
export const AuthCreateUserSchema = z.object({
  email: z.string({ error: "Falta el email" }).trim().toLowerCase().email("Email inválido"),
  password: z.string({ error: "Falta la contraseña" }).min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export const AuthDeleteUserSchema = z.object({
  email: z.string({ error: "Falta el email" }).trim().toLowerCase().email("Email inválido"),
});

// --- Cash Movements ---
export const CashMovementInsertSchema = z.object({
  type: z.string({ error: "Tipo, importe y descripción son requeridos" }).trim().min(1, "Tipo, importe y descripción son requeridos"),
  category: z.string().trim().max(100).nullable().optional(),
  amount: z.number({ error: "Tipo, importe y descripción son requeridos" }),
  payment_method: z.string().trim().max(50).optional().default("Efectivo"),
  description: z.string({ error: "Tipo, importe y descripción son requeridos" }).trim().min(1, "Tipo, importe y descripción son requeridos").max(1000),
  reference_code: z.string().trim().max(100).nullable().optional(),
  barber_id: z.number().int().positive("Profesional inválido").nullable().optional(),
});

// --- Payouts ---
export const PayoutInsertSchema = z.object({
  barber_id: z.number({ error: "Elegí un profesional" }).int().positive("Elegí un profesional"),
  period_start: z.string({ error: "El período no es válido" }).trim().regex(/^\d{4}-\d{2}-\d{2}$/, "El período no es válido"),
  period_end: z.string({ error: "El período no es válido" }).trim().regex(/^\d{4}-\d{2}-\d{2}$/, "El período no es válido"),
  advance_ids: z.array(z.number().int().positive()).optional().default([]),
  payment_method: z.string({ error: "Elegí un medio de pago" }).trim().min(1, "Elegí un medio de pago"),
  reference_code: z.string().trim().max(100).nullable().optional(),
  receipt_notes: z.string().trim().max(1000).nullable().optional(),
});

// --- Google Reviews ---
export const GoogleReviewsCandidateSchema = z.object({
  query: z.string().trim().max(500).optional().default(""),
});

// --- Storage ---
export const StorageDeleteSchema = z.object({
  bucket: z.string({ error: "Faltan bucket o path en el body" }).trim().min(1, "Faltan bucket o path en el body"),
  path: z.string({ error: "Faltan bucket o path en el body" }).trim().min(1, "Faltan bucket o path en el body"),
});

