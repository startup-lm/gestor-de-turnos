# Arquitectura del Proyecto (Gestor de Turnos)

Este documento detalla la estructura principal del repositorio base `gestor-de-turnos` y marca los lineamientos técnicos de cómo están acopladas sus piezas fundamentales.

## 1. Estructura de Carpetas Clave

- `/app`: Motor principal de rutas (Next.js App Router).
  - Incluye rutas estáticas como `page.tsx` (Página de Inicio generada y revalidada con SSR/ISG).
  - Incluye servicios de la capa Server bajo `/app/api/` (Endpoints para mutaciones de la BD).
- `/components`: Elementos modulares divididos por contexto funcional de negocio y de UI.
  - `/turnos`: Toda la interactividad atada al flujo de un turno (ej: `AppointmentDetailsSplitPanel.tsx`, `BookingSplitPanel.tsx`).
  - `/admin`: Componentes enfocados a la carga y selectores (Pickers).
  - `/ui`: Componentes estructurales base y sin lógica fuerte de negocio.
- `/lib`: Capa intermedia de utilidades lógicas y patrones.
  - `/lib/repository`: **Módulo vital.** Contiene las llamadas Asíncronas tipadas (`appointments.ts`, `services.ts`, etc.) hacia las API Routes locales.
  - `/lib/supabase`: Contiene el inicializador del cliente Supabase.
  - `/lib/types`: Contratos tipados de TypeScript para reflejar la base de datos (Ej: `Appointment.ts`).
- `/styles`: Declaraciones Vanilla/Tailwind globales y esquemas (`variables.css`) donde ocurre el aislamiento *White Label* de colores.

## 2. Patrón de Obtención y Mutación de Datos (Data-Fetching)

El proyecto emplea una arquitectura de Red enfocada a optimizar el caché integrado de Next.js. Las pantallas evitan usar el cliente estandarizado cliente-BD directo salvo contadas excepciones.

**Flujo Típico de Mutación:**
1. Un SSR Component (como `page.tsx`) carga repositorios como `getProducts()`.
2. Las acciones de cliente (ej. Borrar Turno) disparan funciones en `/lib/repository/appointments.ts`.
3. El repositorio ejecuta un asíncrono `fetch()` hacia `/api/appointments/`.
4. El Route Handler (Route Server) procesa el evento con el entorno privilegiado `supabaseAdmin`, actualiza Base de Datos y, de ser necesario, usa `revalidateTag("appointments")` para limpiar el caché inter-global.

## 3. Estado Local de UI
El estado inter-fase (Component-to-Component) se confía a Hooks locales (`useState`), composición paramétrica y stores puntuales de Zustand (`lib/store/`). No se usan modales: los flujos de creación/edición cambian de vista dentro del panel (`viewMode: 'list' | 'create'`, ver `AGENTS.md` §9).

## 4. Seguridad de la API

- **Toda ruta que lee o escribe datos internos valida la sesión primero**, con `requireAdmin()` o `requireBarberOrAdmin()` de `lib/api/auth.ts`, antes de tocar la base. `app/api/__tests__/authGuards.test.ts` lo verifica para cada ruta: si agregás una ruta protegida, sumala a esa lista.
- **Rutas públicas** (reserva, cancelación, home): `GET /api/appointments` enmascara cliente, teléfono, precio y datos fiscales y solo acepta filtros conocidos; `GET /api/barbers` devuelve solo campos públicos a anónimos; `GET /api/business-settings` quita secretos (`lib/settings/sanitize.ts`).
- **RLS activo en todas las tablas** (`20261101000000_security_hardening.sql`): la anon key no lee ni escribe directo. Única excepción: lectura de `appointments` para staff autenticado (realtime del calendario).
- **Rate limit** persistente vía `checkRateLimit()` (función `check_rate_limit` de Postgres), con fallback en memoria.
- **Errores**: `dbErrorResponse(error, contexto)` registra el detalle y devuelve un mensaje genérico; nunca se envía el mensaje crudo de Postgres.
- **Storage**: solo buckets conocidos, solo imágenes de hasta 5 MB; un barbero solo modifica el bucket `barbers`. El acceso al proveedor está aislado en `lib/storage/server.ts`.

## 5. Planes y Feature Flags

`business_settings.plan` (`basic` | `standard` | `premium`) define qué features y límites tiene cada cliente (`PLAN_FEATURES` y `PLAN_LIMITS` en `lib/flags/index.ts`). `business_settings.features` queda para overrides puntuales y tiene prioridad sobre el plan. Ambos campos los modifica solo el dueño del SaaS directo en la base: `PUT /api/business-settings` los descarta.

| Flag | basic | standard | premium |
|---|---|---|---|
| `arca`, `metrics`, `sales`, `commission_payouts`, `staff_management`, `google_reviews`, `booking_rules` (criterio de asignación) | — | ✓ | ✓ |
| `finances`, `expenses` | — | — | ✓ |
| Profesionales | 1 | 4 | sin límite |
| Medios de cobro | por defecto | 3 | sin límite |

- **Servidor**: toda mutación de una feature paga valida el plan con `requirePlanFeature(flag)` o `getServerPlanContext()` (`lib/flags/server.ts`). Ocultar la UI no alcanza.
- **Configuración efectiva**: `applyPlanToSettings` (`lib/settings/sanitize.ts`) devuelve los valores por defecto de lo que el plan no incluye, para que reserva y cobros usen siempre lo que corresponde.
- **Feature nueva**: agregar el flag en `DEFAULT_FEATURES` (apagado) y sumarlo al plan que la venda.
