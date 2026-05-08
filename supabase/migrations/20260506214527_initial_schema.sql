-- ============================================================
-- Schema Maestro Unificado (PROD + LOCAL MERGE)
-- ============================================================

-- Barberos
CREATE TABLE IF NOT EXISTS barbers (
  id              bigserial PRIMARY KEY,
  name            text,
  email           text UNIQUE NOT NULL,
  role            text NOT NULL DEFAULT 'barber',
  image           text,
  instagram       text,
  active          boolean NOT NULL DEFAULT true,
  commission      double precision,
  sale_commission double precision NOT NULL DEFAULT 0.2
);

-- Servicios
CREATE TABLE IF NOT EXISTS services (
  id          bigserial PRIMARY KEY,
  name        text,
  description text,
  price       bigint,
  image       text,
  duration    bigint NOT NULL DEFAULT 30
);

-- Clientes (Agregado LOCAL)
CREATE TABLE IF NOT EXISTS clients (
  id              bigserial PRIMARY KEY,
  name            text NOT NULL,
  phone           text UNIQUE NOT NULL,
  last_visit_date date,
  created_at      timestamp with time zone DEFAULT now()
);

-- Horarios de negocio (Cambiado a _global para match PROD)
CREATE TABLE IF NOT EXISTS business_hours_global (
  id          smallint PRIMARY KEY DEFAULT 1,
  open_time   time without time zone NOT NULL,
  close_time  time without time zone NOT NULL,
  lunch_start time without time zone,
  lunch_end   time without time zone,
  closed_days integer[] NOT NULL DEFAULT '{}'::integer[]
);

-- Configuración del negocio
CREATE TABLE IF NOT EXISTS business_settings (
  id                 smallint PRIMARY KEY DEFAULT 1,
  slot_step_minutes  integer NOT NULL DEFAULT 30
);

-- Productos
CREATE TABLE IF NOT EXISTS products (
  id          bigserial PRIMARY KEY,
  name        text,
  description text,
  price       bigint,
  image       text,
  stock       int DEFAULT 0 -- Mejora LOCAL
);

-- Ventas
CREATE TABLE IF NOT EXISTS sales (
  id         bigserial PRIMARY KEY,
  created_at date NOT NULL DEFAULT CURRENT_DATE,
  product_id bigint REFERENCES products(id) ON DELETE SET NULL,
  barber_id  bigint REFERENCES barbers(id) ON DELETE SET NULL,
  price      bigint,
  quantity   bigint,
  total      bigint,
  details    text
);

-- Turnos
CREATE TABLE IF NOT EXISTS appointments (
  id           bigserial PRIMARY KEY,
  date         date NOT NULL,
  start_time   time without time zone NOT NULL,
  end_time     time without time zone,
  client       text NOT NULL,
  phone        text,
  paid         boolean NOT NULL DEFAULT false,
  price        bigint,
  payment_method text, -- Mejora LOCAL
  service_id   bigint REFERENCES services(id) ON DELETE SET NULL DEFAULT 1,
  barber_id    bigint REFERENCES barbers(id) ON DELETE SET NULL,
  client_id    bigint REFERENCES clients(id) ON DELETE SET NULL, -- Mejora LOCAL
  created_at   timestamp with time zone DEFAULT now(),
  created_by   text,
  updated_at   timestamp with time zone DEFAULT now(),
  deleted_at   timestamp with time zone,
  deleted_by   text
);

-- ============================================================
-- Datos de prueba (Opcional, para facilitar el desarrollo)
-- ============================================================

INSERT INTO barbers (name, email, role, image, instagram) VALUES
  ('Juan Barber',  'juan@test.com',  'barber', '', '@juan'),
  ('Admin Test',   'admin@test.com', 'admin',  '', '@admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO services (name, duration, price) VALUES
  ('Corte de pelo', 30, 3000),
  ('Corte + Barba', 45, 4500),
  ('Barba',         20, 2000)
ON CONFLICT DO NOTHING;

INSERT INTO business_hours_global (id, open_time, close_time, lunch_start, lunch_end, closed_days) VALUES
  (1, '09:00', '19:00', '13:00', '14:00', '{0}'::integer[])
ON CONFLICT DO NOTHING;

INSERT INTO business_settings (id, slot_step_minutes) VALUES 
  (1, 30)
ON CONFLICT DO NOTHING;

INSERT INTO clients (name, phone, last_visit_date) VALUES
  ('Mauri Oubiña', '1133445566', CURRENT_DATE)
ON CONFLICT DO NOTHING;
