# Changelog
Todas las modificaciones notables de este proyecto serán documentadas en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y este proyecto se rige bajo [Semantic Versioning (SemVer)](https://semver.org/lang/es/).

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
