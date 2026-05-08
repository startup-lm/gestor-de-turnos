-- Agrega la columna payment_method a la tabla appointments para llevar registro del método de pago
ALTER TABLE public.appointments 
ADD COLUMN payment_method text;

-- Opcional: Agregar un comentario a la columna para documentar los valores esperados
COMMENT ON COLUMN public.appointments.payment_method IS 'Valores esperados: "Efectivo", "MercadoPago", "Transferencia" o NULL si no está pagado';
