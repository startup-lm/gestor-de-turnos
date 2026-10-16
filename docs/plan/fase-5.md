# Fase 5: Entorno de Pruebas Completo

## Objetivo de la Fase
1. Definir la estrategia de ramas de Git para operar con un único repositorio central y múltiples deploys en producción.
2. Establecer la configuración de variables de entorno del Vercel existente de `gestor-de-turnos` asegurando aislamiento total de los clientes productivos.
3. Proveer la query para cargar la identidad del cliente piloto (**Hellfish**) en la base de `gestor-de-turnos`.
4. Detallar la lista de chequeos (checklist de QA) para validar que la app reproduce visual y funcionalmente la experiencia de Hellfish antes de cualquier cutover en Fase 6.

---

## 1. Estrategia de Ramas en Git

La arquitectura multi-cliente funcionará bajo el siguiente esquema de ramas dentro de `gestor-de-turnos`:

```mermaid
gitGraph
   commit id: "Base inicial"
   branch main
   checkout main
   commit id: "Mejoras / Features"
   commit id: "Testing en gestor-de-turnos"
   branch release
   checkout release
   merge main id: "Deploy a Clientes (Hellfish / Hooligans)"
   checkout main
   commit id: "Nueva feature en desarrollo"
```

### Ramas y sus roles:
1. **`main` (Desarrollo, Integración y Testing Interno)**:
   * Es tu rama principal de trabajo en `gestor-de-turnos`.
   * Tu Vercel de `gestor-de-turnos` está conectado a `main`.
   * Cada commit o mejora que merges a `main` se despliega en tu Vercel interno apuntando exclusivamente a tu Supabase de `gestor-de-turnos`.
   * Acá probás features nuevas, corregís bugs y validás las configuraciones.
2. **`release` (Producción para todos los clientes)**:
   * Es la rama estable y testeada que consumen los deploys de Vercel de los clientes (`hellfish`, `hooligans` y futuros clientes).
   * **Nunca se edita código directo en `release`**. Solo recibe merges desde `main` cuando vos diste el "OK" tras probar en `gestor-de-turnos`.
   * Cuando quieras llevar una tanda de mejoras a todos los clientes, hacés un Pull Request de `main` a `release` en GitHub. Al mergearlo, Vercel compila el nuevo bundle para todos los clientes en paralelo de forma instantánea.

---

## 2. Variables de Entorno en el Vercel del Base

En el dashboard de Vercel para el proyecto `gestor-de-turnos` (Settings -> Environment Variables), verificá que las siguientes variables apunten únicamente a tu proyecto Supabase de `gestor-de-turnos`:

| Variable | Descripción | Valor / Origen |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL de la API de Supabase | La URL de tu Supabase de `gestor-de-turnos` (no de clientes). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima pública | La clave anónima de tu Supabase de `gestor-de-turnos`. |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave administrativa de servidor | La service_role de tu Supabase de `gestor-de-turnos`. |
| `NEXT_PUBLIC_BASE_URL` | URL pública de la app | La URL de deploy de Vercel (ej: `https://gestor-de-turnos.vercel.app`). |

---

## 3. Query para Cargar la Identidad de Hellfish en el Base

Para probar en vivo que tu app de `gestor-de-turnos` se transforma en Hellfish, pegá y ejecutá este script en el **SQL Editor** del Supabase de `gestor-de-turnos`:

```sql
UPDATE public.business_settings
SET
  business_name = 'Hellfish Barber Studio',
  slogan = NULL,
  phone = '1133675227',
  location_address = 'Justo G. Bermudez 2480, Olivos, Provincia de Buenos Aires',
  theme_colors = '{
    "background": "#0A0A0A",
    "foreground": "#FFFFFF",
    "primary": "#000000",
    "secondary": "#FFFFFF",
    "accent": "#6B7280"
  }'::jsonb,
  features = '{"arca": false}'::jsonb,
  our_story = ARRAY[
    'Hellfish Barber Estudio abrió sus puertas el 7 de junio de 2024 en Olivos, con la idea de cambiar el esquema de la barbería de barrio.'::text,
    'Nos enfocamos en la experiencia del cliente, brindando asesoramiento personalizado y un servicio premium en cada visita.'::text,
    'En Hellfish, combinamos estilo, técnica y confort para ofrecer la mejor atención y calidad de la zona.'::text
  ],
  social_media = '[
    {"name": "instagram", "url": "https://instagram.com/hellfishbarberstudio", "active": true},
    {"name": "whatsapp", "url": "https://api.whatsapp.com/send?phone=+5491133675227&text=Hola!%20Quiero%20reservar%20un%20turno.", "active": true},
    {"name": "facebook", "url": "https://www.facebook.com/hellfish.barberstudio?locale=es_LA", "active": true}
  ]'::jsonb
WHERE id = 1;
```

---

## 4. Checklist de Validación (QA) para el Piloto

Una vez cargada la configuración, navegá tu app de `gestor-de-turnos` (en local con `npm run dev` o en tu Vercel) y verificá la siguiente lista de chequeos:

### A. Portada y Branding (`/`)
- [ ] **Título**: El Hero muestra "Hellfish Barber Studio" y la pestaña del navegador tiene ese título.
- [ ] **Colores**: Fondo negro profundo (`#0A0A0A`), textos blancos (`#FFFFFF`) y acentos en gris (`#6B7280`).
- [ ] **Acciones**: El botón de "Reservar Turno" redirige fluidamente a `/turnos`.
- [ ] **Carruseles**: Se listan los servicios y productos con sus precios y nombres.

### B. Sección "Sobre Nosotros" (`/nosotros`)
- [ ] **Historia**: Se leen los 3 párrafos de Hellfish ("Hellfish Barber Estudio abrió sus puertas el 7 de junio de 2024...").
- [ ] **Ubicación y Mapa**: El iframe de Google Maps apunta a "Justo G. Bermúdez 2480, Olivos".
- [ ] **Redes Sociales**: Los botones dirigen a `@hellfishbarberstudio` en Instagram y al WhatsApp `1133675227`.
- [ ] **Barberos**: Se renderizan las tarjetas de barberos.

### C. Flujo de Reserva de Turnos (`/turnos`)
- [ ] **Selección**: Permite seleccionar servicio, barbero y navegar el calendario.
- [ ] **Inputs en Tema Oscuro**: El selector nativo de horario (`<input type="time">`) muestra el icono del reloj visible en blanco (gracias a `.time-input::-webkit-calendar-picker-indicator`).
- [ ] **Cursor Pointer**: Las celdas libres del calendario muestran el cursor en forma de mano interactiva.
- [ ] **Confirmación WhatsApp**: Al confirmar el turno, el link de WhatsApp abre con el número de Hellfish (`1133675227`).

### D. Flujo de Cancelación (`/turnos/cancelar`)
- [ ] Permite buscar un turno y cancelarlo sin arrojar errores.

### E. Blindaje de Feature Flags en Panel Admin (`/admin`)
- [ ] **Tarjeta de Facturación**: La tarjeta de "Facturación ARCA" **NO aparece** en el panel admin (porque `features.arca = false`).
- [ ] **Bloqueo de Ruta Directa**: Al tipear manualmente `/admin/facturacion` en la URL, se visualiza la pantalla de "Módulo No Disponible" y no se expone ningún formulario fiscal.
- [ ] **Ventas**: En `/admin/ventas`, la tabla de ventas no muestra la columna de factura fiscal.
- [ ] **Cobro de Turno**: En el modal de cobrar turno, no se solicita emisión de comprobante ARCA.
