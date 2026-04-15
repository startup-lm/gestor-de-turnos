# Arquitectura del Proyecto (Gestor de Turnos)

Este documento detalla la estructura principal del repositorio base `gestor-de-turnos` y marca los lineamientos técnicos de cómo están acopladas sus piezas fundamentales.

## 1. Estructura de Carpetas Clave

- `/app`: Motor principal de rutas (Next.js App Router).
  - Incluye rutas estáticas como `page.tsx` (Página de Inicio generada y revalidada con SSR/ISG).
  - Incluye servicios de la capa Server bajo `/app/api/` (Endpoints para mutaciones de la BD).
- `/components`: Elementos modulares divididos por contexto funcional de negocio y de UI.
  - `/turnos`: Toda la interactividad atada al flujo de un turno (ej: `AppointmentDetailsModal.tsx`).
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
El estado inter-fase (Component-to-Component) se confía puramente a Hooks locales (`useState`) y composición paramétrica. Existen patrones customizados que persisten el estado modal como `usePopup()`.
