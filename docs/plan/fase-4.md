# Fase 4: Migraciones Versionadas con Supabase CLI

## Objetivo de la Fase
1. Inicializar el sistema de migraciones versionadas en `gestor-de-turnos`.
2. Versionar el **Schema de Verdad** como migración inicial (`20261016000000_initial_schema.sql`).
3. Escribir la **Migración Delta** (`20261016000001_multicliente_delta.sql`) para actualizar clientes existentes sin ejecutarla en producción todavía.
4. Preparar los comandos de `migration repair` y el workflow de GitHub Actions (`deploy-migrations.yml`).
5. Documentar los conceptos clave con ejemplos concretos de este proyecto y la regla de retrocompatibilidad.
6. Aplicar las columnas finales en el Supabase actual de `gestor-de-turnos` consolidándolo como entorno base de desarrollo y testing.

---

## Conceptos Clave de Migraciones (con ejemplos de este proyecto)

### 1. Migración Inicial (`Initial Migration`)
* **Concepto**: Es el script SQL fundacional que crea toda la estructura de tablas, claves primarias, foráneas, tipos y defaults del **Schema de Verdad** desde una base de datos vacía.
* **Ejemplo concreto en este proyecto**: El archivo [`supabase/migrations/20261016000000_initial_schema.sql`](file:///Users/mauriciooubina/Desktop/Workspace/gestor-de-turnos/supabase/migrations/20261016000000_initial_schema.sql). Cuando sumes un cliente nuevo a futuro, corrés esta migración y en un segundo se crean todas las tablas (`appointments`, `barbers`, `business_settings` con `features`, `clients`, etc.) listas para operar.

### 2. Migración Delta (`Delta Migration`)
* **Concepto**: Es un script SQL incremental diseñado para aplicarse sobre una base de datos que **ya existe y tiene datos productivos**. Lleva la base desde un estado viejo hacia el Schema de Verdad sin borrar ni recrear tablas.
* **Ejemplo concreto en este proyecto**: El archivo [`supabase/migrations/20261016000001_multicliente_delta.sql`](file:///Users/mauriciooubina/Desktop/Workspace/gestor-de-turnos/supabase/migrations/20261016000001_multicliente_delta.sql). Hellfish tiene turnos históricos desde junio de 2024. Este script le agrega a su tabla `business_settings` el campo `features jsonb`, crea la tabla `clients` y añade `payment_method` a `appointments` con sentencias `ADD COLUMN IF NOT EXISTS`, sin tocar una sola fila de sus datos.

### 3. Reparación de Historial (`Migration Repair`)
* **Concepto**: Comando de Supabase CLI que sincroniza la tabla interna de control (`supabase_migrations.schema_migrations`) para indicarle que una versión ya fue aplicada **sin ejecutar el archivo SQL**.
* **Ejemplo concreto en este proyecto**: En tu base de `gestor-de-turnos`, las tablas ya existen. Si corrés `supabase db push`, la CLI intentaría correr `initial_schema.sql` y fallaría con `table "barbers" already exists`. Con `npx supabase migration repair --status applied 20261016000000` le decís a Supabase: *"Registrá que la versión inicial ya está aplicada en esta base, no intentes volver a correrla"*.

### 4. Regla de Retrocompatibilidad (`Backward Compatibility`)
* **Concepto**: Ninguna migración de base de datos puede romper el código que está corriendo en producción en este milisegundo.
* **Regla técnica**:
  1. Solo cambios aditivos (`ADD COLUMN IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`).
  2. Toda columna nueva es `NULL` o tiene `DEFAULT`.
  3. Jamás hacemos `DROP COLUMN` ni `RENAME COLUMN` en el mismo paso.
* **Ejemplo concreto en este proyecto**: La tabla `wa_sessions` presente en Hellfish: aunque no se usa en el frontend, la dejamos viva intacta para no romper bots o integraciones externas del cliente.

---

## Archivos Creados en la Fase 4

1. [`supabase/migrations/20261016000000_initial_schema.sql`](file:///Users/mauriciooubina/Desktop/Workspace/gestor-de-turnos/supabase/migrations/20261016000000_initial_schema.sql): Migración inicial del Schema de Verdad.
2. [`supabase/migrations/20261016000001_multicliente_delta.sql`](file:///Users/mauriciooubina/Desktop/Workspace/gestor-de-turnos/supabase/migrations/20261016000001_multicliente_delta.sql): Migración delta incremental.
3. [`.github/workflows/deploy-migrations.yml`](file:///Users/mauriciooubina/Desktop/Workspace/gestor-de-turnos/.github/workflows/deploy-migrations.yml): Workflow de GitHub Actions con selección de entorno (`testing`, `base`, `hellfish`, `hooligans`, `all_clients`).
4. [`scripts/apply-migrations.sh`](file:///Users/mauriciooubina/Desktop/Workspace/gestor-de-turnos/scripts/apply-migrations.sh): Script ejecutable para gestionar estado, push y repair localmente.
5. Corrección en [`supabase/.gitignore`](file:///Users/mauriciooubina/Desktop/Workspace/gestor-de-turnos/supabase/.gitignore) para permitir el seguimiento de `migrations/` en Git.

---

## Simplificación y Aplicación en el Base
* Se descartó la creación de proyectos adicionales innecesarios en Supabase para evitar sobrecarga operativa.
* Se utilizó directamente el Supabase actual de `gestor-de-turnos` como entorno de validación.
* El usuario ejecutó con éxito en el SQL Editor de `gestor-de-turnos`:
  ```sql
  ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS features jsonb NOT NULL DEFAULT '{}'::jsonb;
  ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS slogan text;
  ```
* La base de datos del base quedó 100% alineada al Schema de Verdad.

---

## Pendiente para la Fase 5
* Proponer la estrategia de ramas de Git (`main` para pruebas internas y `release` para clientes).
* Definir la conexión del Vercel existente de `gestor-de-turnos` asegurando que apunte a su base de prueba.
* Proveer la lista de chequeos concretos para validar que la app reproduce exactamente al cliente piloto Hellfish (colores, fotos, textos, barberos, redes, reservas).
