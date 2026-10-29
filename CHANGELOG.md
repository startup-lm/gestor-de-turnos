# Changelog
Todas las modificaciones notables de este proyecto serán documentadas en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y este proyecto se rige bajo [Semantic Versioning (SemVer)](https://semver.org/lang/es/).

---

## [1.4.0] - 2026-10-29

### Agregado
- **Módulo de Google Reviews (Reseñas de Google)**:
  - **Feature Flag `google_reviews`**: Incorporación del flag en `lib/flags/index.ts`, apagado por defecto (`false`) para cumplir estrictamente con la arquitectura multi-cliente aislada.
  - **Estrategia Cache & Sync en Supabase**:
    - Columna `google_reviews JSONB` en `business_settings` (migración `20261029000000_google_reviews.sql`).
    - Las visitas públicas leen de Supabase en < 10ms sin consultar a Google, garantizando costo $0 real dentro del crédito mensual de $200 USD de Google Cloud.
  - **Servicio y Endpoint de Sincronización**:
    - `lib/services/googlePlaces.ts`: Soporte de doble etapa (Places API New con fallback automático a Places API Legacy).
    - `app/api/google-reviews/sync/route.ts`: Endpoint administrativo seguro para sincronizar calificación, total de opiniones y comentarios oficiales.
  - **Panel de Administración en el Gestor (`ConfigResenasSection`)**:
    - Integración en `AdminSidebar.tsx` dentro del grupo "Configuración", condicional a `google_reviews` y rol `admin`.
    - Detección interactiva de candidatos ("¿Es este tu local en Google Maps?") tanto por nombre comercial + dirección como por buscador manual y links de Google Maps.
    - Moderación individual de reseñas con switch "Visible" / "Oculta" para destacar las mejores opiniones.
    - Carga manual de reseñas destacadas (100% gratuita sin cuenta de Google Cloud).
    - Previsualización en vivo (Live Preview) idéntica a la vista del sitio web a ancho completo (`w-full`).
  - **Componentes Visuales Públicos**:
    - `GoogleReviewsSection`: Carrusel interactivo automático con `KeenSlider` y `KeenAutoplayPlugin` (rotación cada 4.5s, pausa al posar el mouse, flechas de navegación responsive y dots indicadores).
    - `GoogleRatingBadge`: Micro-badge visual informativo en el Hero de portada (no interactivo).
    - `GoogleReviewCard`: Tarjetas de reseña con estrellas doradas, avatar de Google optimizado, nombre y cita.
    - Integración condicional en la página de inicio (`app/page.tsx`) ubicada después de la sección "¿Dónde estamos?", y en la página "Sobre nosotros" (`app/nosotros/page.tsx`).
  - **Arquitectura y Reglas del Repositorio**:
    - Regla 10 en `AGENTS.md`: Obligatoriedad de `Loader2` y props de carga estándar (`loading={...}`) en botones, con prohibición de alterar textos a gerundios ("Guardando...", "Cargando...").
    - Soporte de dominios CDN de Google (`*.googleusercontent.com`, `lh3.googleusercontent.com`) en `next.config.ts`.
  - **Tests automatizados**:
    - Tests unitarios en `lib/flags/__tests__/flags.test.ts` y `lib/services/__tests__/googlePlaces.test.ts` (66 tests pasando en total).

---

## [1.3.0] - 2026-10-28

### Agregado
- **Suite de pruebas automatizadas y arquitectura de testing**:
  - Incorporación de **Vitest** con `@testing-library/react` y entorno liviano `happy-dom`.
  - Creación de 60 tests automatizados distribuidos en 11 suites de prueba:
    - **Lógica pura y utilidades**: generación de intervalos de turnos (`generateAllAppointments`), enmascaramiento para calendario (`transformAppointmentsToEvents`), normalización estricta de números telefónicos de Argentina (`normalizePhone`) y algoritmo de control de tasa (`rateLimit`).
    - **Validación de contratos y schemas (Zod)**: verificación de integridad para inserción, cobro y cancelación de turnos y sincronización de clientes.
    - **Seguridad y endpoints de API**: verificación de enmascaramiento de privacidad de turnos para usuarios anónimos (`guest`), bloqueo de modificaciones a turnos con comprobante fiscal ARCA, validación de permisos de administrador para movimientos de caja y registro cruzado automático de egresos al liquidar comisiones en efectivo.
    - **Hooks y stores reactivos**: pruebas de estado global en Zustand (`useTurnosStore`, `useToastStore`) y cálculo de comisiones acumuladas por profesional (`useTotalComissions`).
  - Creación de suite E2E moderna con **Playwright** para verificación de navegación pública y cancelación de turnos sin modales.
  - **Integración continua de doble etapa en GitHub Actions (`ci.yml`)**:
    - En cada PR o push a `main`: ejecución de `lint`, `type-check` y tests unitarios e integrados con Vitest (< 15 segundos).
    - En cada PR o merge hacia `release`: ejecución de la suite completa más smoke tests E2E con Playwright antes del despliegue a clientes.
- **Validaciones de backend en API de turnos (`app/api/appointments/route.ts`)**:
  - Detección y rechazo con error 400 de intentos de reserva en horarios pasados por parte de clientes anónimos.
  - Detección y rechazo con error 400 de solapamientos entre turnos o servicios largos y slots previamente agendados para un mismo profesional.

### Eliminado
- **Suite obsoleta de Playwright (`tests/`)**:
  - Eliminación de 7 archivos de prueba antiguos que apuntaban de forma insegura a URLs de producción y dependían de modales flotantes en desuso.

---

## [1.2.1] - 2026-10-28

### Corregido
- **Layout y Contención en Vista Mobile de Administración (`AdminClient.tsx` & `components.css`)**:
  - Eliminación de la altura rígida forzada `height: calc(100vh - 105px)` en el contenedor `<aside>` en mobile, la cual provocaba un espacio vacío residual de más de 650px expulsando el contenido hacia abajo.
  - Implementación de la clase responsiva `.admin-sidebar-aside` que establece `height: auto` y fijación pegada al borde inferior del navbar (`top: var(--navbar-height, 65px)`) en mobile, preservando el scroll independiente y altura 100vh únicamente en desktop (`lg:`).
- **Barra de Navegación Mobile en Administración (`AdminSidebar.tsx`)**:
  - Remoción del badge `v1.2.0` del primer puesto en las pastillas de navegación deslizable móvil, ubicándolo como footer unificado al pie del panel de administración.
  - Unificación completa de los nombres de módulos y secciones entre la vista mobile y web, resolviendo la duplicación del término "Pagos" y asegurando concordancia exacta 1:1 en Sentence case ("Panel de control", "Balance y liquidaciones", "Historial de pagos", "Gastos del local", "Gestión de turnos", "Gestión de ventas", "Comprobantes", "Configuración ARCA", "Gestión de barberos", "Identidad y marca", "Horarios y atención", "Contacto y canales", "Medios de pago").
- **Alineación de Redacción en Sentence Case (`DashboardClient.tsx` & `AdminSidebar.tsx`)**:
  - Corrección de "Panel de Control y Métricas" a "Panel de control y métricas" y de "Gestor de Turnos" a "Gestor de turnos" en conformidad con la Regla 8 de `AGENTS.md`.

---

## [1.2.0] - 2026-10-28

### Agregado
- **Módulo de Caja Diaria, Gastos y Liquidación Efectiva de Comisiones (Fase 1)**:
  - **Feature Flag `cash_management`**: Protección de la funcionalidad bajo `cash_management: false` por defecto en `lib/flags/index.ts`, configurable por cada cliente desde su base de datos Supabase.
  - **Liquidación Efectiva de Comisiones (`LiquidationPanel`)**:
    - Registro formal de pago de liquidaciones a profesionales con selección de período, desglose de cortes y ventas de productos en panel dentro de la página con botón "Volver" (sin modales).
    - Detección y deducción automática de adelantos otorgados en el período mediante checkboxes seleccionables.
    - Soporte para pagos en Efectivo (con egreso automático registrado en la caja diaria) y Transferencia bancaria (con número de comprobante/referencia opcional).
    - Emisión instantánea de **Recibo Digital de Liquidación** interno y botón de un clic para copiar el recibo formateado a WhatsApp.
  - **Gestión de Adelantos a Barberos (`AdvancePanel`)**:
    - Panel integrado en la sección de Gastos del local para registrar adelantos de comisión a profesionales que se descuentan automáticamente en la liquidación final.
  - **Control de Gastos y Egresos del Local (`ExpensePanel` & `ExpensesHistoryTable`)**:
    - Registro categorizado de egresos del negocio en panel dentro de la página (insumos, servicios públicos, alquiler, limpieza, retiros de dueño).
    - Eliminación de botones duplicados en la barra de herramientas de la tabla de egresos.
    - Deducción de gastos operativos para el cálculo de la **Ganancia Neta Real** en los KPIs financieros.
  - **Historial de Liquidaciones (`LiquidacionesSection` & `PayoutsHistoryTable`)**:
    - Sección dedicada con botón accionable para iniciar nueva liquidación y auditoría de todos los pagos realizados a profesionales, detalle de comprobante, importes abonados y copia del recibo a WhatsApp.
  - **Finanzas y Balance de Caja como Sección Informativa**:
    - Conversión a pantalla puramente analítica de métricas y copia de balances para WhatsApp, retirando botones de acción y modales.
  - **Regla 9 en `AGENTS.md` (Prohibición Estricta de Modales)**:
    - Adopción mandatoria del patrón de paneles en pantalla (`viewMode: "list" | "new-..."`) con botón `<ArrowLeft /> Volver` para todos los flujos de creación y edición.
  - **Frecuencia de Cierre de Caja Configurable (`ConfigPagosSection`)**:
    - Selector en panel de administración para definir la frecuencia de cierre de caja según la operativa de cada barbería: Diario (al final del día), Semanal (al finalizar la semana) o Personalizado/Manual.
  - **Migración Supabase Versionada (`20261028000000_cash_management_and_payouts.sql`)**:
    - Tablas aditivas `cash_shifts`, `cash_movements` y `commission_payouts` con índices optimizados para auditoría contable.

---

## [1.1.1] - 2026-10-27

### Corregido
- **Menú Mobile (Drawer & Backdrop)**:
  - Corrección del bug de contención CSS donde el `backdrop-filter` del navbar restringía la altura del menú y del backdrop a 88px, provocando que el fondo no cubriera la pantalla completa.
  - Implementación de React Portal (`createPortal(..., document.body)`) para desacoplar el cajón y el backdrop del stacking context del navbar, logrando que el fondo del menú y el backdrop oscuro se posicionen correctamente por encima de toda la pantalla (`h-dvh` y `fixed inset-0`).
  - Bloqueo del scroll del body mientras el menú móvil permanece desplegado.

### Agregado
- **Reglas de Agentes (`AGENTS.md`)**:
  - Prohibición de tests exploratorios automáticos levantando Chrome/subagentes salvo pedido expreso del usuario.
  - Obligatoriedad de diseño y validación dual responsiva (Desktop + Mobile) ante cualquier cambio visual.

---

## [1.1.0] - 2026-10-27

### Agregado
- **Facturación Electrónica ARCA (AFIP)**:
  - Módulo completo de integración con ARCA: configuración de credenciales de certificados digitales (CRT y KEY), punto de venta y número de CUIT.
  - Generación, emisión y almacenamiento de comprobantes fiscales (Facturas B).
  - Vistas dedicadas en el panel de administración: `Facturas` (listado, filtros por fecha, estado fiscal y descarga) y `Configuración ARCA`.
- **Arquitectura Multi-Cliente & Feature Flags**:
  - Aislamiento de configuraciones por cliente en `business_settings.features` (`jsonb`).
  - Utilidad universal `isFeatureEnabled` y `isServerFeatureEnabled` en `lib/flags/`.
  - Configuración inicial de flag `arca: false` por defecto para planes que no contraten facturación electrónica.
- **Control y Exposición de Versiones**:
  - Exposición de la variable de versión `APP_VERSION` en `lib/version.ts` conectada a `package.json`.
  - Indicador visible y elegante de versión en el footer inferior del sidebar del Panel de Administración.
  - Reglas para agentes en `AGENTS.md` y guía técnica de versionado en `docs/VERSIONING.md`.
- **Inmutabilidad y Blindaje Fiscal**:
  - Bloqueo integral en backend (APIs `PATCH`, `PUT`, `DELETE`) y frontend contra la modificación o eliminación de turnos y ventas que ya cuenten con comprobante fiscal emitido ante ARCA o estado cobrado.
  - Ficha resumen oficial del comprobante ARCA en los detalles individuales de turnos (`/turno/[id]`) y ventas (`/venta/[id]`), con código CAE, copia rápida al portapapeles y enlace directo al historial de Facturación.

### Cambiado
- **Reorganización del Panel de Administración**:
  - Menú lateral reestructurado en secciones lógicas (*Métricas*, *Finanzas*, *Operaciones*, *Facturación* y *Configuración del Local*).
  - Desacople de pestañas y sincronización bidireccional mediante query param `?tab=`.
- **Optimización de Rendimiento y Assets**:
  - Migración y entrega de imágenes en formato moderno WebP.
  - Optimización de imports de bibliotecas pesadas (`lucide-react`, `date-fns`) y skeletons de carga para mejorar Largest Contentful Paint (LCP).

### Corregido
- Corrección de hidratación y anidamiento de etiquetas en componentes cliente y de error.
- Ajuste de filtros por rango de fechas en reportes de ventas y citas.

---

## [1.0.0] - 2026-10-16

### Agregado
- **Gestión Integral de Turnos**:
  - Flujo público de reservas de turnos con selección de barbero, servicio, fecha y hora.
  - Cancelación y reprogramación de citas.
  - Integración de notificaciones vía WhatsApp.
- **Panel Administrativo & Métricas**:
  - Calendario y lista de turnos en tiempo real.
  - Balance de ventas, métricas de ingresos, cálculo de comisiones por barbero.
  - Configuración de barberos, servicios, productos, horarios y medios de pago.
- **Identidad de Marca**:
  - Personalización de colores, historia y enlaces de redes sociales.
- **Soporte PWA**:
  - Service worker configurado para experiencia offline básica e instalable en dispositivos móviles.
- **Versionado de Base de Datos**:
  - Migración inicial `20261016000000_initial_schema.sql` y deltas en `supabase/migrations/`.
