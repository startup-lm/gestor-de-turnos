# Fase 0: Reconocimiento (solo lectura)

## Objetivo de la Fase
Revisar el stack tecnológico, la estructura de carpetas, el estado de Git de las tres carpetas (`gestor-de-turnos`, `barberia-hooligans`, `hellfish-barber-studio`) y cómo se lee hoy la configuración del local (colores, fotos, barberos, redes) en el proyecto base.

---

## Hallazgos Principales

### 1. Estado de Git y Ramas
* **`gestor-de-turnos` (Base)**:
  * Rama activa creada para el plan: `plan/multi-cliente` (a partir de `main` en commit `83e8451`).
  * Remoto: `https://github.com/startup-lm/gestor-de-turnos.git`.
  * Estado de trabajo: limpio (solo archivos del plan en `docs/plan/`).
* **`barberia-hooligans` (Cliente - Solo Lectura)**:
  * Rama activa: `master` (último commit `8a0cf72 Merge pull request #49 from startup-lm/develop`).
  * Remoto: `https://github.com/startup-lm/barberia-hooligans.git`.
  * Estado: preservado intacto (solo un `package-lock.json` modificado previo no commiteado).
* **`hellfish-barber-studio` (Cliente - Solo Lectura)**:
  * Rama activa: `main` (último commit `f2a8d13 Merge pull request #24 from startup-lm/develop`).
  * Remoto: `https://github.com/startup-lm/hellfish-barber-studio.git`.
  * Estado: preservado intacto (solo un `package-lock.json` modificado previo no commiteado).

### 2. Comparativa de Stack Tecnológico
* **Framework y Runtime**:
  * Base: Next.js `15.5.18`, React `19.2.6`.
  * Clientes: Next.js `15.2.6`, React `19.0.0`.
* **Estilos**:
  * Los tres usan Tailwind CSS v4 (`@tailwindcss/postcss`, `tailwindcss: ^4`).
  * El base y los clientes comparten archivos CSS modulares en `styles/` (`variables.css`, `base.css`, `buttons.css`, etc.).
* **Bases de Datos / Backend**:
  * Los tres usan `@supabase/supabase-js: ^2.49.4`, `@supabase/ssr: ^0.6.1`, `@supabase/auth-helpers-nextjs: ^0.10.0`.
  * El base ya cuenta con `supabase/config.toml` (CLI preparado), pero no tiene directorio `supabase/migrations/` formalmente inicializado aún.
* **Librerías Adicionales en el Base**:
  * `@ducanh2912/next-pwa` (Soporte PWA).
  * `@playwright/test` (Testing E2E).
  * `zustand` (Manejo de estado).
  * `zod` (Validación de schemas).
  * `swr` (Data fetching/cache).
  * `libphonenumber-js` y `react-phone-number-input`.
  * Integración de facturación ARCA (`components/arca/`, `app/api/arca/`, `lib/repository/arca.ts`).

### 3. Cómo se lee hoy la configuración del local en el Base (`gestor-de-turnos`)
El proyecto base ya tiene un avance significativo hacia la parametrización de configuración en comparación con los clientes:

1. **Tabla y Endpoint `business_settings`**:
   * En `app/api/business-settings/route.ts` y `lib/repository/businessSettings.ts`, se consulta el registro `id = 1` de `business_settings`.
   * Campos seleccionados:
     * `slot_step_minutes` (duración del bloque del turno).
     * `phone` (teléfono de contacto).
     * `payment_methods` (métodos de pago).
     * `social_media` (array de redes: `{ name, url, active }`).
     * `our_story` (array de párrafos para la sección "Sobre Nosotros").
     * `location_address` (dirección física para Google Maps).
     * `local_photo` (URL de la foto de fachada/local).
     * `assignment_criteria` (criterio de asignación de turnos).
     * `business_name` (nombre del negocio, que actualiza `document.title` y el Hero).
     * `business_logo` (URL del logo).
     * `theme_colors` (objeto JSON: `background`, `foreground`, `primary`, `secondary`, `accent`).

2. **Inyección Dinámica de Colores (`BusinessContext.tsx`)**:
   * `BusinessProvider` envuelve la app y recupera la configuración de negocio.
   * Inyecta una etiqueta `<style>` con las variables CSS raíz (`--background`, `--foreground`, `--primary`, `--secondary`, `--accent`) sobrescribiendo los valores por defecto de `styles/variables.css`.
   * Dispone de un modal de administración (`BrandingSettingsModal.tsx`) para editar colores y logo.

3. **Barberos (`barbers`)**:
   * Se cargan dinámicamente desde la tabla `barbers` mediante `lib/repository/barbers.ts` (`id, email, name, image, instagram, role, active, commission, sale_commission`).

4. **Redes Sociales e Historia**:
   * Se leen desde los campos `social_media` y `our_story` de `business_settings` en `app/nosotros/page.tsx`, con fallbacks estáticos por si están vacíos.

5. **Ubicación y Mapa**:
   * `components/nosotros/GoogleMapsLocation.tsx` recibe `address?: string` y genera la URL del iframe dinámicamente.

6. **Contraste con los Clientes (`barberia-hooligans` y `hellfish-barber-studio`)**:
   * En ambos clientes, la tabla `business_settings` solo consulta `slot_step_minutes`.
   * Los colores están codificados de forma fija en `styles/variables.css`.
   * Las redes sociales están hardcodeadas en `utils/socialMedia.ts`.
   * La historia está hardcodeada en `utils/nuestraHistoria.ts`.
   * La foto del local y logo son archivos estáticos en `public/images/`.
   * La dirección y coordenadas del mapa están hardcodeadas en `GoogleMapsLocation.tsx`.
   * El número de WhatsApp está hardcodeado en `DEFAULT_PHONE` en `utils/whatsapp.ts`.

---

## Decisiones Tomadas y Justificación
* **Aislamiento absoluto**: Se verificó que las carpetas de los clientes no sufrieran modificaciones.
* **Rama de trabajo**: Se estableció `plan/multi-cliente` en `gestor-de-turnos` para albergar la documentación y los futuros desarrollos.
* **Compatibilidad de diseño**: Se identificó que el base ya cuenta con la estructura fundamental de `theme_colors` y `business_settings` dinámicos, lo que facilitará enormemente la Fase 1 y Fase 3 para parametrizar Hooligans y Hellfish.

---

## Pendiente para la Fase 1
* Comparar el estado actual de los archivos de `barberia-hooligans` y `hellfish-barber-studio` contra el base (no historiales).
* Armar el informe clasificando cada diferencia en:
  1. Valores que deben pasar a configuración del cliente.
  2. Mejoras que deben entrar al base para todos.
  3. Funcionalidad específica de cliente que debe ir detrás de un flag.
* Proponer cuál de los dos clientes es el mejor piloto.
