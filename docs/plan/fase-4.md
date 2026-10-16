# Fase 4: Migraciones Versionadas con Supabase CLI

## Objetivo de la Fase
1. Inicializar el sistema de migraciones versionadas en `gestor-de-turnos`.
2. Versionar el **Schema de Verdad** como migración inicial (`20261016000000_initial_schema.sql`).
3. Escribir la **Migración Delta** (`20261016000001_multicliente_delta.sql`) para actualizar clientes existentes sin ejecutarla en producción.
4. Preparar los comandos de `migration repair` y el workflow de GitHub Actions (`deploy-migrations.yml`).
5. Documentar los conceptos clave con ejemplos concretos de este proyecto y la regla de retrocompatibilidad.
6. Guiar al usuario para crear el entorno Supabase de testing con la estructura del cliente piloto y validar la migración.

---

## Conceptos Clave de Migraciones (con ejemplos de este proyecto)

### 1. Migración Inicial (`Initial Migration`)
* **Concepto**: Es el script SQL fundacional que crea toda la estructura de tablas, claves primarias, foráneas, tipos y defaults del **Schema de Verdad** desde una base de datos vacía.
* **Ejemplo concreto en este proyecto**: El archivo [`supabase/migrations/20261016000000_initial_schema.sql`](file:///Users/mauriciooubina/Desktop/Workspace/gestor-de-turnos/supabase/migrations/20261016000000_initial_schema.sql). Si el mes que viene sumás un nuevo cliente ("Barbería Centro"), creás su proyecto en Supabase, corrés esta migración inicial y en 2 segundos tenés todas las tablas (`appointments`, `barbers`, `business_settings` con `features`, `clients`, etc.) creadas y listas para usar.

### 2. Migración Delta (`Delta Migration`)
* **Concepto**: Es un script SQL incremental diseñado para aplicarse sobre una base de datos que **ya existe y tiene datos productivos**. Lleva la base desde un estado viejo hacia el Schema de Verdad sin borrar ni recrear tablas.
* **Ejemplo concreto en este proyecto**: El archivo [`supabase/migrations/20261016000001_multicliente_delta.sql`](file:///Users/mauriciooubina/Desktop/Workspace/gestor-de-turnos/supabase/migrations/20261016000001_multicliente_delta.sql). Hellfish tiene turnos históricos desde junio de 2024. No podés borrar su base; la migración delta le agrega la columna `features jsonb` a `business_settings`, crea la tabla `clients` y agrega `payment_method` a `appointments` mediante sentencias `ADD COLUMN IF NOT EXISTS`, sin tocar una sola fila de sus clientes.

### 3. Reparación de Historial (`Migration Repair`)
* **Concepto**: Comando de Supabase CLI que manipula la tabla interna de control (`supabase_migrations.schema_migrations`) para marcar una migración como aplicada o revertida **sin ejecutar el archivo SQL**.
* **Ejemplo concreto en este proyecto**: En tu base de testing actual de `gestor-de-turnos`, vos ya tenías creadas las tablas a mano. Si corrés `supabase db push`, la CLI intentaría correr `20261016000000_initial_schema.sql` y fallaría con el error `table "barbers" already exists`. Con el comando:
  ```bash
  npx supabase migration repair --status applied 20261016000000 --db-url "<URL>"
  ```
  Le decís a Supabase: *"Registrá que la versión 20261016000000 ya está aplicada en esta base, no la vuelvas a correr"*.

### 4. Regla de Oro: Retrocompatibilidad (`Backward Compatibility`)
* **Concepto**: Ninguna migración de base de datos puede romper la versión del código que está ejecutándose en producción en ese mismo instante.
* **Regla técnica**:
  1. Toda migración debe ser **aditiva** (`ADD COLUMN IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`).
  2. Las columnas nuevas deben ser **anulables (`NULL`)** o tener un **`DEFAULT`**. Nunca agregar `NOT NULL` sin default en tablas con filas existentes.
  3. **Nunca borrar (`DROP COLUMN`) ni renombrar (`RENAME COLUMN`) en el mismo paso**: si una columna queda en desuso, primero se deja de leer/escribir en el código de la app, y en una migración futura posterior se limpia.
* **Ejemplo concreto en este proyecto**: La tabla `wa_sessions` de Hellfish. Aunque no se usa en Next.js, no la borramos con `DROP TABLE`, protegiendo cualquier bot o integración externa activa.

---

## Archivos Creados en la Fase 4

1. [`supabase/migrations/20261016000000_initial_schema.sql`](file:///Users/mauriciooubina/Desktop/Workspace/gestor-de-turnos/supabase/migrations/20261016000000_initial_schema.sql): Migración inicial del Schema de Verdad.
2. [`supabase/migrations/20261016000001_multicliente_delta.sql`](file:///Users/mauriciooubina/Desktop/Workspace/gestor-de-turnos/supabase/migrations/20261016000001_multicliente_delta.sql): Migración delta incremental.
3. [`.github/workflows/deploy-migrations.yml`](file:///Users/mauriciooubina/Desktop/Workspace/gestor-de-turnos/.github/workflows/deploy-migrations.yml): Workflow de GitHub Actions con selección de entorno (`testing`, `base`, `hellfish`, `hooligans`, `all_clients`).
4. [`scripts/apply-migrations.sh`](file:///Users/mauriciooubina/Desktop/Workspace/gestor-de-turnos/scripts/apply-migrations.sh): Script ejecutable para gestionar estado, push y repair localmente.
5. [`docs/plan/schemas/recreate_hellfish_baseline.sql`](file:///Users/mauriciooubina/Desktop/Workspace/gestor-de-turnos/docs/plan/schemas/recreate_hellfish_baseline.sql): DDL para inicializar el Supabase de testing en el estado exacto de Hellfish.
6. Corrección en [`supabase/.gitignore`](file:///Users/mauriciooubina/Desktop/Workspace/gestor-de-turnos/supabase/.gitignore) para permitir el seguimiento de `migrations/` en Git.

---

## Pasos para el Usuario: Creación y Validación en Supabase de Testing

Para validar que la migración delta funciona al 100% sin riesgo:

### Paso 1: Crear el Proyecto de Supabase de Testing
1. Entrá en tu cuenta de [Supabase Dashboard](https://supabase.com/dashboard).
2. Hacé clic en **"New project"**.
3. Asignale un nombre descriptivo: por ejemplo `gestor-testing-piloto`.
4. Ingresá una contraseña para la base de datos (guardala para la URL).
5. Seleccioná la región y dale a **"Create new project"**. Esperá 1 o 2 minutos a que finalice.

### Paso 2: Cargar el Estado Inicial del Piloto (Sin datos)
1. En el nuevo proyecto de testing, andá a **SQL Editor** -> **New query**.
2. Abrí el archivo local [`docs/plan/schemas/recreate_hellfish_baseline.sql`](file:///Users/mauriciooubina/Desktop/Workspace/gestor-de-turnos/docs/plan/schemas/recreate_hellfish_baseline.sql), copiá todo su contenido y pegalo en el SQL Editor.
3. Hacé clic en **Run**.
*(En este punto, la base de testing es un clon estructural exacto de Hellfish hoy en producción)*.

### Paso 3: Registrar el Baseline y Aplicar la Migración Delta
Copiá la URL de conexión del Pooler del nuevo proyecto (Project Settings -> Database -> Connection String -> URI -> Mode Session / Pooler).

Desde tu terminal en `gestor-de-turnos`:
```bash
# 1. Marcar la migración inicial como ya existente en este clon (para que no intente recrear lo que ya cargaste)
npx supabase migration repair --status applied 20261016000000 --db-url "TU_URL_TESTING"

# 2. Aplicar la migración delta pendiente
npx supabase db push --db-url "TU_URL_TESTING"

# 3. Verificar que ambas migraciones figuren aplicadas
npx supabase migration list --db-url "TU_URL_TESTING"
```
*(También podés usar `./scripts/apply-migrations.sh push "TU_URL_TESTING"`)*.

### Paso 4: Qué resultado esperar
* El comando `db push` debe responder exitosamente aplicando `20261016000001_multicliente_delta.sql`.
* En el Table Editor de Supabase verás las nuevas tablas (`clients`, `arca_invoices`, `arca_settings`) y las columnas añadidas en `business_settings` (`features`, `slogan`, etc.) sin ningún error.
