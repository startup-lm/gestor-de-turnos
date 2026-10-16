# Fase 2: Schema (Dumps y Definición de Schema de Verdad)

## Objetivo de la Fase
Analizar los dumps de schema (estructura DDL, sin datos) obtenidos de los tres proyectos de Supabase (`gestor-de-turnos`, `barberia-hooligans`, `hellfish-barber-studio`), identificar discrepancias a nivel de tablas, columnas, tipos de datos, nulabilidades y defaults, y proponer el **Schema de Verdad** unificado para el modelo multi-cliente.

---

## 1. Comparativa General de Tablas

| Tabla | Base (`gestor-de-turnos`) | Hooligans | Hellfish | Estado / Observación |
| :--- | :---: | :---: | :---: | :--- |
| `appointments` | **SÍ** | **SÍ** | **SÍ** | Común a los 3 (el Base tiene columnas adicionales). |
| `barbers` | **SÍ** | **SÍ** | **SÍ** | Común a los 3. |
| `business_hours_global` | **SÍ** | **SÍ** | **SÍ** | Idéntica en los 3. |
| `business_settings` | **SÍ** | **SÍ** | **SÍ** | En clientes solo tiene `slot_step_minutes`. En Base tiene 10 columnas más. |
| `clients` | **SÍ** | **NO** | **NO** | Tabla de libreta de clientes para autocompletado rápido. |
| `products` | **SÍ** | **SÍ** | **SÍ** | El Base tiene columna `stock`. |
| `sales` | **SÍ** | **SÍ** | **SÍ** | El Base tiene `arca_invoice_id`. |
| `services` | **SÍ** | **SÍ** | **SÍ** | Común a los 3. |
| `arca_invoices` | **SÍ** | **NO** | **NO** | Módulo de facturación electrónica ARCA / AFIP. |
| `arca_settings` | **SÍ** | **NO** | **NO** | Configuración de certificados y puntos de venta ARCA. |
| `wa_sessions` | **NO** | **NO** | **SÍ** | Tabla presente solo en Hellfish (posible bot/webhook de WhatsApp externo). |

---

## 2. Detalle de Columnas Discrepantes por Tabla

### A. Tabla `business_settings`
En los clientes (`hooligans` y `hellfish`), la tabla quedó congelada en su versión original de solo 2 columnas:
* `id` (`smallint`, PK)
* `slot_step_minutes` (`integer`)

En el Base (`gestor-de-turnos`), la tabla evolucionó para soportar la configuración dinámica:
* `phone` (`text`, nullable)
* `business_name` (`text`, default `'Barbería Premium'`)
* `location_address` (`text`, nullable)
* `local_photo` (`text`, nullable)
* `business_logo` (`text`, nullable)
* `assignment_criteria` (`text`, default `'random'`)
* `theme_colors` (`jsonb`, nullable)
* `payment_methods` (`jsonb`, default `["Efectivo", "Mercado Pago"]`)
* `social_media` (`jsonb`, default redes sociales activas/inactivas)
* `our_story` (`text[]`, array de párrafos de historia)

### B. Tabla `appointments`
El Base tiene 4 columnas agregadas para trazabilidad, facturación y tipos de eventos:
* `payment_method` (`text`, nullable): Método con el que se cobró el turno.
* `client_id` (`bigint`, nullable): Clave foránea referenciando a `clients.id`.
* `type` (`text`, default `'appointment'`): Para diferenciar turnos de clientes de bloqueos de agenda o almuerzos.
* `arca_invoice_id` (`bigint`, nullable): Vinculación con comprobante emitido en `arca_invoices`.

### C. Tabla `products`
* `stock` (`integer`, default `0`): Existe en el Base para control de inventario de productos. En los clientes no existe.

### D. Tabla `sales`
* `arca_invoice_id` (`bigint`, nullable): Existe en el Base para relacionar una venta de mostrador con su factura electrónica.

### E. Tablas Exclusivas del Base: `clients`, `arca_invoices`, `arca_settings`
* `clients`: Soporta el feature de autocompletado en reserva (`name`, `phone`, `last_visit_date`, `created_at`).
* `arca_invoices` y `arca_settings`: Soporte fiscal ARCA/AFIP (estará apagado por feature flag por defecto).

### F. Tabla Exclusiva de Hellfish: `wa_sessions`
* Columnas: `id` (int PK), `phone` (text), `stage` (text), `data` (jsonb), `updated_at` (timestamptz), `name` (text).
* No está referenciada en el código Next.js. Es probablemente una integración externa para un bot de WhatsApp.
* **Regla de retrocompatibilidad**: No se debe eliminar (`DROP`) en Hellfish para evitar romper integraciones externas que el cliente pueda tener activas.

---

## 3. Discrepancias Menores de Tipos y Defaults en Columnas Comunes

| Columna | Base | Hooligans | Hellfish | Decisión para Schema de Verdad |
| :--- | :--- | :--- | :--- | :--- |
| `appointments.service_id` | Default `'1'` | Default `'1'` | Default `null` | **Default `'1'::bigint`** (garantiza que siempre haya un servicio base asignado). |
| `barbers.email` | `NOT NULL` | `NOT NULL` | `NULLABLE` | **`NOT NULL`** (requerido para autenticación de barberos). Si en Hellfish hay registros sin email, se completan antes de aplicar constraint. |
| `barbers.role` | Default `'barber'` | Default `''` | Default `null` | **Default `'barber'::text` NOT NULL**. |
| `services.duration` | Default `'30'` | Default `'30'` | Default `null` | **Default `'30'::bigint` NOT NULL**. |

---

## 4. Propuesta del "Schema de Verdad"

El **Schema de Verdad** adoptará como base el schema actual de `gestor-de-turnos` con las siguientes adiciones clave necesarias para el plan multi-cliente:

1. **En tabla `business_settings`**:
   * Agregar columna **`features` (`jsonb`, default `'{}'::jsonb`, NOT NULL)**: Para almacenar los feature flags activos de cada cliente (`arca_billing_enabled`, `whatsapp_rich_format`, etc.).
   * Agregar columna opcional **`slogan` (`text`, nullable)**: Para permitir bajadas personalizadas de portada (ej. "100% CALAMAR" en Hooligans).
   * Mantener todas las columnas de branding (`theme_colors`, `business_name`, `business_logo`, `local_photo`, `location_address`, `our_story`, `social_media`, `payment_methods`, `assignment_criteria`, `phone`).

2. **En tabla `appointments`**:
   * Consolidar `client_id`, `payment_method`, `type` y `arca_invoice_id` (todas anulables para retrocompatibilidad).

3. **Tablas de soporte**:
   * Mantener `clients`, `products` (con `stock`), `sales` (con `arca_invoice_id`).
   * Mantener `arca_invoices` y `arca_settings` (quedarán latentes e inactivas en clientes mientras el flag de ARCA esté apagado).

4. **Tratamiento de `wa_sessions` (Hellfish)**:
   * Se respeta en Hellfish (no se borra). En el base no se crea a menos que se decida unificar formalmente un módulo de bot.

---

## Pendiente para la Fase 3
* Solicitar al usuario que genere un **backup completo del Supabase del base** y esperar confirmación explícita.
* Crear una nueva rama en `gestor-de-turnos` para el desarrollo de la Fase 3.
* Agregar el campo `features` (`jsonb`) a `business_settings`.
* Implementar el helper `isEnabled('nombre_flag')` con fallback a defaults en código (todos apagados por defecto).
* Mover los valores clasificados al sistema de configuración y parametrizar las pantallas detrás de flags.
