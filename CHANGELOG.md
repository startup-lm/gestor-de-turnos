# Changelog
Todas las modificaciones notables de este proyecto serán documentadas en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y este proyecto se rige bajo [Semantic Versioning (SemVer)](https://semver.org/lang/es/).

---

## [1.9.0] - 2026-11-03

Liquidaciones y comisiones confiables, `/admin` como único lugar de gestión y menú ajustable. **Requiere aplicar la migración `20261105000000_payout_links_and_commission_snapshot.sql`.**

### Agregado
- **Liquidaciones atadas a turnos y ventas:** cada turno o venta cobrado queda marcado con la liquidación que lo pagó. Un cobro atrasado de un período ya liquidado entra en la próxima liquidación, que lo avisa ("Incluye 2 cobros atrasados"), en vez de perderse.
- **Comisión congelada:** cada turno y venta guarda el % del barbero al momento de cobrarse. Si después cambia el %, Métricas, Balance y las liquidaciones de meses anteriores no se recalculan.
- Filtro "Solo retiros del dueño" en Gastos y total retirado en Balance.
- **Productos y servicios en `/admin`:** el alta, la edición y la baja se hacen desde Operaciones → Productos y Servicios. La lista de productos muestra el stock y marca los que no tienen.
- **Control de stock en ventas** (planes estándar y premium): cada venta descuenta las unidades vendidas, y editarla o borrarla las devuelve. En "Nueva venta" cada producto muestra cuántas unidades quedan, los que no tienen stock no se pueden elegir y la cantidad no puede superar lo disponible. Si dos ventas se llevan el último producto a la vez, solo una se registra.
- **Mi perfil en `/admin`:** cada barbero edita su foto, sus datos y su contraseña desde el menú lateral.
- **Cerrar sesión en el pie del menú lateral**, junto al nombre del producto y la versión.
- **Aviso de turnos pasados sin cobrar** en Resumen: cuenta los turnos del período que ya terminaron y no se cobraron (incluye clientes que no vinieron), y "Ver turnos" abre la agenda filtrada en esos turnos.

### Corregido
- **Liquidaciones de períodos abiertos:** no se puede liquidar un período que termina después de hoy. Si el período elegido sigue abierto, se liquida hasta hoy y se avisa.
- **Turnos y ventas liquidados:** ya no se pueden editar, descobrar ni borrar sin anular antes la liquidación, para que el pago no quede desfasado de lo que muestra el sistema.
- **Retiro del dueño:** se registraba como gasto y bajaba la ganancia neta. Ahora resta de la caja pero no de la ganancia (los retiros ya cargados se corrigen con la migración).
- **Ticket promedio en Métricas:** se dividía la facturación de los turnos cobrados por todos los turnos agendados, y salía muy por debajo del real. La tarjeta ahora muestra los turnos cobrados y, debajo, los agendados.
- **Medio de pago obligatorio** al cobrar un turno o registrar una venta: sin él, el cobro no se puede ubicar en la caja.
- **Reseñas de Google:** sin opiniones se mostraba una calificación de 5.0 inventada, en el sitio y en la configuración. Ahora no se muestra ninguna.

### Cambiado
- **Menú lateral de `/admin` ajustable:** el borde derecho se arrastra para ensancharlo o achicarlo (entre 180 y 360 px), y cada navegador recuerda el ancho elegido. Arrastrándolo hasta el borde se colapsa, y doble clic lo vuelve al ancho por defecto, que ahora es más angosto (220 px). También se ajusta con las flechas del teclado.
- **Catálogo público de solo lectura:** `/productos` y `/servicios` (y su detalle) ya no tienen botones de edición.
- **Criterio de asignación de turnos** disponible también en el plan estándar.
- El ícono de usuario del header solo aparece para invitados y lleva a ingresar.
- "Horarios y atención" pasa a llamarse "Horarios y reservas".
- **Métricas pasa a llamarse Resumen** y muestra la actividad del local: turnos, productos vendidos y ticket promedio. Los totales de plata (facturación y comisiones) quedan solo en Balance.

### Eliminado
- Botones "Ver todas en Google" y "Dejar una reseña" al pie de la sección de reseñas de Google.
- Rutas viejas que solo redirigían o duplicaban pantallas de `/admin`: `/dashboard`, `/configuracion`, `/operaciones/*` (incluida la página duplicada de barberos), `/turnos/[id]`, `/ventas/[id]`, `/barbers/[id]`, `/productos/nuevo` y `/servicios/nuevo`.
- Menú desplegable del usuario en el header.
- En Balance, la tarjeta "Operaciones totales" y el bloque "Estructura de ingresos", que repetían los montos de las tarjetas de arriba.

## [1.8.0] - 2026-11-03

Revisión integral del panel `/admin`: seguridad, cálculo de plata, código duplicado y experiencia de uso.

### Corregido
- **Datos de clientes expuestos sin login:** `/turno/[id]` y `/venta/[id]` se podían abrir sin sesión (nombre, teléfono, precio y datos fiscales, enumerables por número). Ahora exigen sesión en el middleware y en la propia página.
- **Permisos del staff:** un barbero podía editar, cobrar o borrar turnos y ventas de otros, y el PATCH de turnos aceptaba cualquier columna (`deleted_at`, `arca_invoice_id`, `price`...). Ahora el barbero ve todo el local pero solo modifica lo suyo, y el PATCH acepta una lista cerrada de campos.
- **Totales calculados en el navegador:** el total de una venta y el de un comprobante ARCA se tomaban de lo que mandaba el navegador. Ahora los calcula el servidor (`price × quantity`, o el monto del turno o la venta).
- **Doble facturación:** un turno o una venta se podían facturar dos veces (doble clic o dos pestañas). La marca del comprobante es condicional y el segundo intento se deshace.
- **Comisiones:** se calculaban sobre todos los turnos del período, incluso los no cobrados. Ahora cuentan solo los cobrados, se calculan en el servidor y no se puede liquidar dos veces el mismo período.
- **Adelantos:** se descontaban por rango de fechas (podían descontarse dos veces o nunca). Ahora cada adelanto queda atado a la liquidación que lo descontó.
- **Egreso de caja de una liquidación:** si fallaba, quedaba la liquidación sin su movimiento y sin aviso. Ahora se revisa el error y se deshace todo.
- **Zona horaria:** los filtros por fecha usaban medianoche UTC; lo cargado entre las 21 y las 24 h caía en el día siguiente. Ahora usan el día de Argentina.
- **Tope de 1000 filas:** métricas, comisiones y caja sumaban como máximo 1000 registros sin avisar. Ahora se pagina hasta traer todo.
- **Error de hidratación en todas las páginas:** el menú se renderizaba distinto en el servidor y en el navegador.
- **Reseñas ocultas:** el id de algunas reseñas dependía de su posición; al reordenar Google, se podía ocultar otra.

### Agregado
- Anulación de liquidaciones, gastos y adelantos (con confirmación en línea; anular una liquidación libera sus adelantos).
- "Caja por medio de pago" en Balance: lo que debería haber en cada medio al cerrar la caja.
- Medio de pago en las ventas.
- Vista previa de la liquidación calculada en el servidor, con aviso de período superpuesto y de adelantos que superan la comisión.
- Barberos inactivos visibles y reactivables; se pueden liquidar aunque ya no trabajen.
- Reseñas de Google en vivo, con atribución de Google, y moderación por reseña.
- Detalle de turno con comprobante emitido (CAE copiable), WhatsApp del cliente y "Revertir cobro".
- Banner de modo demo en Comprobantes y confirmación antes de facturar en lote.
- Aviso de cambios sin guardar y botón "Descartar" en la configuración.

### Cambiado
- Un solo detalle de turno: `/turno/[id]` usa el mismo panel que la agenda.
- El sidebar se genera desde una sola configuración; cada ítem coincide con el título de su pantalla.
- Selector de período, formato de moneda, campos fiscales de ARCA y confirmaciones compartidos entre pantallas.
- Textos en sentence case, sin mayúsculas forzadas; fechas y roles legibles.
- La tabla de turnos se ve como tarjetas en mobile.

### Eliminado
- Carga manual de reseñas y edición de la calificación de Google.
- Reseñas guardadas en la base (las políticas de Google no permiten almacenarlas).
- Modal de confirmación de borrado (reemplazado por confirmación en línea).
- Endpoints sin uso: `GET/PUT/DELETE /api/sales` y `PUT /api/appointments`.
- Código muerto: `ArcaPage`, `TurnoDetailClient`, `useSalesRevenueForBarber`, layout de `/dashboard`; `/operaciones/turnos` y `/operaciones/ventas` redirigen al panel.

## [1.7.0] - 2026-11-02

### Cambiado
- **El producto pasa a llamarse Turnik.** El panel admin muestra "Turnik" y el footer público "© <año> Turnik by LM². Todos los derechos reservados." (sin el nombre del local).
- El título de la pestaña y la PWA instalable toman el nombre del local desde `business_settings.business_name` (fallback "Turnik"), mediante `generateMetadata` y `app/manifest.ts` dinámico con revalidación cada 60 s.

### Agregado
- `lib/brand.ts` con `PRODUCT_NAME` y `PRODUCT_CREDIT`.

### Corregido
- Al cambiar de sección en el panel admin ya no se vuelve a montar la sección anterior (con su skeleton) antes de mostrar la nueva. El cambio de pestaña actualiza la URL con `history.replaceState`, sin volver a pedir la página al servidor.

### Eliminado
- `public/manifest.json` (reemplazado por `app/manifest.ts`).

## [1.6.1] - 2026-11-02

### Corregido
- **Policies de RLS abiertas** (migración `20261103000000_tighten_rls_policies.sql`): con la anon key se podían leer todos los turnos (nombres y teléfonos) y la configuración privada, crear turnos salteando la API, y cualquier usuario autenticado podía editar o borrar turnos. Ahora solo queda la lectura de turnos para staff activo (realtime del calendario).
- Los buckets de storage limitan a 5 MB e imágenes JPG, PNG, WEBP o GIF, igual que `/api/storage`.
- Se quita el flag obsoleto `cash_management` de `features`.

## [1.6.0] - 2026-11-02

### Agregado
- **Tres planes comerciales (`basic` | `standard` | `premium`)** en `lib/flags/index.ts`:
  - `basic`: turnos, servicios, productos, "Nosotros", WhatsApp, horarios e identidad. 1 profesional y medios de cobro por defecto.
  - `standard`: + facturación ARCA, métricas, venta de productos, liquidación de comisiones, gestión de profesionales (hasta 4), reseñas de Google y hasta 3 medios de cobro.
  - `premium`: + finanzas, registro de gastos, criterio de asignación de turnos, profesionales y medios de cobro ilimitados.
- **Límites por plan** (`PLAN_LIMITS`, `getPlanLimits`) validados en el servidor: alta de profesionales y cantidad de medios de cobro.
- **Validación de plan en la API** (`requirePlanFeature`, `getServerPlanContext`): ventas, liquidaciones y gastos responden 403 si el plan no los incluye.
- **Alta de cuentas de profesionales desde el servidor** (`POST /api/auth` con `auth.admin.createUser`): permite apagar el registro público de Supabase.
- Migración `20261102000000_commercial_plans.sql`.

### Cambiado
- El panel de administración muestra cada sección según el plan; una sección no incluida cae a la sección por defecto (turnos si no hay métricas).
- La configuración leída aplica el plan (`applyPlanToSettings`): sin criterio de asignación el turno se asigna aleatorio y `basic` usa los medios de cobro por defecto.

### Eliminado
- Plan `pro` y flag `cash_management` (reemplazados por `finances`, `expenses` y `commission_payouts`).
- Registro de cuentas con `supabase.auth.signUp` desde el navegador.

## [1.5.0] - 2026-11-01

### Agregado
- **Planes comerciales (`basic` | `pro`)**: columna `business_settings.plan` y `PLAN_FEATURES` en `lib/flags/index.ts`. Prioridad: override en `features` > plan > apagado. Sin plan se asume `basic` (todo apagado).
- **Rate limit persistente**: tabla `rate_limits` y función `check_rate_limit` en Postgres, compartida entre instancias serverless (`checkRateLimit()`), con fallback en memoria.
- **Test de guards de autenticación** (`app/api/__tests__/authGuards.test.ts`): verifica que cada ruta protegida responda 401 sin sesión y sin tocar la base.
- Migración `20261101000000_security_hardening.sql`.

### Corregido
- **Rutas sin autenticación**: `storage`, `sales/[id]`, `sales/all`, `sales/list`, `sales/barber`, `appointments/all`, `arca/config`, `arca/emit`, `arca/invoices`, `arca/status`, `admin/revalidate` y `GET /api/auth` ahora exigen sesión de staff o admin.
- **Storage**: solo buckets conocidos, solo imágenes de hasta 5 MB y nombres de archivo planos; un barbero solo modifica el bucket `barbers`.
- **Fuga de la API key de Google** en `GET /api/business-settings` y en el HTML de páginas públicas.
- **El admin del local podía activarse features pagas**: `PUT /api/business-settings` ahora descarta `plan` y `features`.
- **`GET /api/appointments`**: solo acepta filtros conocidos (antes se podía buscar por teléfono) y enmascara también los datos fiscales para anónimos.
- **`GET /api/barbers` y páginas públicas**: email y comisiones solo para staff.
- **Perfil `/barbers/[id]`**: requiere sesión, un barbero solo ve su propio perfil y ya no se cachea con ISR.
- **Recuperar contraseña**: ya no revela si un email pertenece al equipo.
- **RLS activado en todas las tablas**: la anon key pública deja de poder leer o escribir directo.
- **Errores de base de datos**: se reemplazaron los mensajes crudos de Postgres por un mensaje genérico (`dbErrorResponse`).

### Cambiado
- `docs/ARCHITECTURE.md`: secciones de seguridad y planes; se quitaron las referencias a modales.

---

## [1.4.1] - 2026-10-29

### Corregido
- **Resolución de dependencias en despliegues de CI y Vercel**: Se incorporó archivo de configuración `.npmrc` con `legacy-peer-deps=true` y se actualizó `@types/node` a `^20.19.0` para solucionar el conflicto de peer dependencies `ERESOLVE` entre `vite@8.3.5` y `@types/node` en entornos de compilación automatizada.

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
