-- =====================================================================
-- Prevención de solapamiento de turnos (bloque 1 de auditoría)
--   Garantiza a nivel de base de datos que no se creen ni modifiquen
--   turnos solapados para un mismo profesional en la misma fecha.
--   Usa un lock transaccional por profesional y fecha para evitar
--   condiciones de carrera ante reservas concurrentes.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.prevent_appointment_overlap()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL OR NEW.barber_id IS NULL OR NEW.end_time IS NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE'
     AND OLD.deleted_at IS NULL
     AND NEW.barber_id IS NOT DISTINCT FROM OLD.barber_id
     AND NEW.date IS NOT DISTINCT FROM OLD.date
     AND NEW.start_time IS NOT DISTINCT FROM OLD.start_time
     AND NEW.end_time IS NOT DISTINCT FROM OLD.end_time THEN
    RETURN NEW; -- no cambió el horario: no se revalida (puede haber solapes viejos)
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('appointments:' || NEW.barber_id || ':' || NEW.date, 0));
  IF EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.barber_id = NEW.barber_id AND a.date = NEW.date AND a.deleted_at IS NULL
      AND a.id IS DISTINCT FROM NEW.id
      AND a.start_time < NEW.end_time AND a.end_time > NEW.start_time
  ) THEN
    RAISE EXCEPTION 'APPOINTMENT_OVERLAP' USING ERRCODE = '23P01';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS appointments_prevent_overlap ON public.appointments;
CREATE TRIGGER appointments_prevent_overlap
  BEFORE INSERT OR UPDATE OF barber_id, date, start_time, end_time, deleted_at ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.prevent_appointment_overlap();
