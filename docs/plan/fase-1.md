# Fase 1: Diferencias de Código (Solo Lectura)

## Objetivo de la Fase
Comparar el estado actual de los archivos de `barberia-hooligans` y `hellfish-barber-studio` contra el repositorio base `gestor-de-turnos` (analizando el contenido actual de los archivos, no los historiales de commits).
Clasificar cada diferencia en tres grupos:
1. Valores que deberían pasar a configuración del cliente.
2. Mejoras que deberían entrar al base para todos.
3. Funcionalidad específica de cliente que debería ir en el base detrás de un feature flag.

Proponer cuál de los dos clientes es el mejor piloto.

---

## Hallazgo Fundamental de la Comparación
Al comparar directamente `barberia-hooligans` vs `hellfish-barber-studio`, **solo existen 20 archivos con diferencias entre ambos clientes**, y corresponden casi en un 100% a branding, assets estáticos, textos y colores. Ambos clientes comparten exactamente la misma estructura de rutas, componentes y librerías base.

Por el contrario, la divergencia entre el base (`gestor-de-turnos`) y los dos clientes se debe a que el base fue evolucionando con mejoras arquitectónicas (configuración dinámica en DB, PWA, Playwright, módulo de facturación ARCA, middleware de sesión, refactors en flujo de turnos y diseño UI más moderno).

---

## Clasificación de Diferencias

### Grupo 1: Valores que deben pasar a Configuración del Cliente
Son valores específicos de identidad, branding, localización y contacto que hoy están cableados en archivos de los clientes y deben resolverse vía base de datos (`business_settings`):

1. **Identidad y Textos de Portada**:
   * `business_name`: "Barbería Hooligans" vs "Hellfish Barberstudio" vs "Barbería Premium" (default en base).
   * `slogan`: En Hooligans `"100% CALAMAR"`, en Hellfish vacío `""`, en Base párrafo de bienvenida. Debe ser un campo opcional de texto en configuración.
   * `head.tsx` / `title`: Metadatos de página generados dinámicamente según `business_name`.
2. **Paleta de Colores y Tokens de Tema**:
   * Variables CSS (`--background`, `--foreground`, `--primary`, `--secondary`, `--accent`, `--accent-red`, `--accent-blue`, `--bg-navbar`, `--bg-carousel`, `--calendar-bg`, `--calendar-disabled-slot`):
     * **Hooligans**: Gama marrón y beige cálido (`#5B3A29`, `#EDE0C8`, `#D2B48C`).
     * **Hellfish**: Monocromático de alto contraste negro, blanco y acento rojo (`#0A0A0A`, `#FFFFFF`, `#6B7280`, `#EF4444`).
     * **Base**: Azul marino profundo y acento oro (`#0F172A`, `#F9FAFB`, `#111827`, `#DFBA73`).
   * En `tailwind.config.ts`, ambos clientes tenían una paleta extendida `platense` con valores copiados; esto queda completamente reemplazado por las CSS variables dinámicas que inyecta `BusinessContext`.
3. **Imágenes y Multimedia**:
   * `business_logo`: Logo del negocio (`public/images/logo.png`), en el base ya se puede servir vía URL remota o fallback.
   * `local_photo`: Foto de la fachada/local (`local_hooligans.png` vs `local.jpg`), en el base ya se gestiona vía URL o fallback.
   * `home_bg`: Fondo del hero (`public/images/home.jpg`), cada barbería posee su propia ambientación.
4. **Contacto y Redes Sociales**:
   * Teléfono de WhatsApp (`phone` / `DEFAULT_PHONE`):
     * Hooligans: `1122684646`
     * Hellfish: `1133675227`
   * Lista de Redes (`social_media`):
     * Hooligans: Instagram (`@hooligansbarberia_`), Facebook, WhatsApp, Gmail.
     * Hellfish: Instagram (`@hellfishbarberstudio`), Facebook, WhatsApp.
   * Formato de mensaje WhatsApp: Hooligans usa `#${id}`, Hellfish usa `${id}` con emojis (`🙋‍♂️`, `📅`, `⏰`). Puede admitirse como plantilla o enriquecimiento opcional.
5. **Ubicación Física**:
   * Dirección (`location_address`): Carlos Villate 2516, Olivos (Hooligans) vs Justo G. Bermúdez 2480, Olivos (Hellfish). El base ya genera el iframe de Google Maps a partir de la dirección guardada en `business_settings`.
6. **Historia Institucional**:
   * `our_story`: Párrafos de "Nuestra Historia" (en clientes hardcodeado en `utils/nuestraHistoria.ts`, en el base ya se lee desde `business_settings.our_story`).

---

### Grupo 2: Mejoras que deben entrar al Base para Todos
Cambios de calidad de vida y correcciones que benefician a cualquier cliente y no dependen de la barbería:

1. **Ajustes de UI/UX rescatados de los clientes**:
   * **Indicador nativo de time input en tema oscuro** (de `hellfish/styles/buttons.css`):
     ```css
     .time-input::-webkit-calendar-picker-indicator {
       opacity: 1;
       filter: invert(1) brightness(1.2) contrast(1.1);
       cursor: pointer;
       padding: 2px;
     }
     ```
   * **Cursor pointer en slots clickeables del calendario** (de `hellfish/styles/calendar.css`):
     ```css
     .rbc-time-slot.calendar-slot--clickable {
       cursor: pointer !important;
     }
     ```
2. **Mejoras ya construidas en el Base que se distribuirán a los clientes**:
   * **Autocompletado de clientes en reserva**: `components/turnos/ClientAutocompleteFields.tsx` y tabla/endpoint `clients` (agiliza la reserva recordando datos del cliente).
   * **Seguridad y robustez**: `middleware.ts` con protección de rutas administrativas mediante Supabase Auth SSR y `lib/api/rateLimit.ts`.
   * **Arquitectura PWA**: Capacidad de instalar la app en pantalla de inicio de teléfonos celulares (`@ducanh2912/next-pwa`, `manifest.json`, service worker).
   * **Suite de Testing E2E**: Pruebas automáticas con Playwright (`tests/`) para verificar flujos críticos (reserva, cancelación, login, dashboard).
   * **Panel de administración de Branding**: UI dentro del dashboard para cambiar colores, logos e información del local sin tocar código.

---

### Grupo 3: Funcionalidad específica de Cliente detrás de Feature Flag
Funcionalidades avanzadas o específicas que un cliente puede no querer, no necesitar o no tener contratadas:

1. **Facturación Electrónica ARCA / AFIP (`arca_billing_enabled`)**:
   * Rutas `/admin/facturacion/`, APIs `/api/arca/*` y componentes de emisión de comprobantes.
   * Por defecto: **APAGADO (`false`)**. Ningún cliente lo tiene en producción hoy. Se activa por cliente únicamente cuando configure sus certificados fiscales.
2. **Vistas de administración dedicadas (`admin_turnos_view` / `admin_barbers_view`)**:
   * Pantallas `/admin/turnos` y `/admin/barberos` añadidas en el base. Si un cliente prefiere mantener el flujo minimalista clásico del calendario, puede gobernarse por flag.
3. **Criterio de asignación inteligente de turnos (`assignment_criteria_enabled`)**:
   * Algoritmo de asignación (`random`, `balanced`, `prioritize_barber`, `prioritize_admin`) cuando el cliente final no elige un barbero específico.
4. **Formato enriquecido de WhatsApp (`whatsapp_rich_format`)**:
   * Formateo con emojis y layout extendido para confirmaciones y cancelaciones.

---

## Elección del Cliente Piloto

Se propone a **Hellfish Barber Studio** como el cliente piloto por las siguientes razones:

1. **Menor divergencia y mayor limpieza de código**:
   * No posee remanentes específicos de clubes de fútbol o assets no utilizados como Hooligans (`platense.png`).
   * Ya incorpora las pequeñas mejoras de CSS (cursor pointer en calendar y fix de selector de hora) que se incorporarán al base.
   * Su lista de redes sociales está limpia y alineada al schema del base.
2. **Facilidad de homologación de Git**:
   * Hellfish ya utiliza la rama `main` por defecto (igual que `gestor-de-turnos`). Hooligans utiliza `master`.
3. **Prueba visual inconfundible (Alto Contraste)**:
   * La identidad de Hellfish es estrictamente monocromática (negro profundo, blanco puro y acento rojo). Si durante las pruebas en Fase 5 algún componente no tomara la configuración dinámica del cliente, la interfaz revelaría inmediatamente los colores azules/dorados por defecto del base, permitiendo detectar cualquier regresión visual al instante.

---

## Pendiente para la Fase 2
* Solicitar al usuario los dumps de schema (solo estructura, sin datos) de los tres proyectos de Supabase (`gestor-de-turnos`, `barberia-hooligans`, `hellfish-barber-studio`), brindando los pasos exactos para obtenerlos.
* Comparar los tres schemas, identificar discrepancias y proponer el schema de verdad.
