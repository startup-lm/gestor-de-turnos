-- Resincroniza las secuencias de IDs (identity y serial) de las tablas del schema public
-- con el máximo valor existente en su columna. Idempotente: nunca baja una secuencia
-- y no toca las secuencias de tablas vacías.
DO $$
DECLARE
  r record;
  max_val bigint;
  cur_val bigint;
  cur_called boolean;
BEGIN
  FOR r IN
    SELECT s.oid::regclass AS seq, t.relname AS tbl, a.attname AS col
    FROM pg_class s
    JOIN pg_depend d
      ON d.objid = s.oid
     AND d.classid = 'pg_class'::regclass
     AND d.refclassid = 'pg_class'::regclass
     AND d.deptype IN ('a', 'i')
    JOIN pg_class t ON t.oid = d.refobjid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = d.refobjsubid
    WHERE s.relkind = 'S'
      AND n.nspname = 'public'
      AND t.relkind IN ('r', 'p')
  LOOP
    EXECUTE format('SELECT max(%I) FROM public.%I', r.col, r.tbl) INTO max_val;
    EXECUTE format('SELECT last_value, is_called FROM %s', r.seq) INTO cur_val, cur_called;
    IF max_val IS NOT NULL
       AND (max_val > cur_val OR (max_val = cur_val AND NOT cur_called)) THEN
      PERFORM setval(r.seq, max_val, true);
    END IF;
  END LOOP;
END $$;
