# Fase 3: Flags y Configuración en el Base

## Objetivo de la Fase
1. Asegurar el backup del Supabase del Base previo a cualquier cambio.
2. En una rama nueva de `gestor-de-turnos` (`feat/multi-cliente-config-flags`), agregar el soporte de `features` (`jsonb`) y `slogan` (`text`) en la configuración de negocio.
3. Crear el helper centralizado `isFeatureEnabled(flag, features)` / `isEnabled(flag)` con fallback a defaults en código (toda feature nueva sale apagada por defecto).
4. Poner el módulo de facturación ARCA detrás del flag `arca` tanto en la interfaz (admin, ventas, turnos) como en los endpoints del servidor.
5. Parametrizar el `slogan` en el Hero y consolidar los fixes de CSS identificados.

---

## Decisiones de Diseño y Justificación Técnica

### 1. Helper de Feature Flags Centralizado (`lib/flags/index.ts`)
* **Diseño**:
  * Se definieron los defaults en código mediante el objeto tipado `DEFAULT_FEATURES = { arca: false }`.
  * La función `isFeatureEnabled(flag, features)` resuelve la activación con la siguiente jerarquía de precedencia:
    1. Valor booleano explícito en la base de datos del cliente (`features[flag]`).
    2. Default estricto definido en código (`DEFAULT_FEATURES[flag]`).
    3. Fallback defensivo: `false`.
  * Se creó además el helper de servidor `isServerFeatureEnabled(flag)` para que los endpoints de API (`/api/arca/*`) puedan verificar la habilitación en backend consultando `business_settings.features` sin depender del contexto de React.
* **Justificación**:
  * Cumple con la regla de oro: *"Toda feature nueva sale con el default apagado"*. Si un cliente nuevo se da de alta o una base de datos vieja no tiene la columna `features`, el sistema asume `false` de forma segura sin romper la app.

### 2. Integración en `BusinessContext.tsx`
* **Diseño**:
  * Se extendió `BusinessContextType` con `isEnabled: (flag) => boolean` e `isFeatureEnabled: (flag) => boolean`.
  * Como `BusinessProvider` ya envuelve toda la aplicación y hace caché de la fila `id = 1` de `business_settings`, cualquier componente cliente puede consultar `const { isEnabled } = useBusinessContext()` de forma síncrona, reactiva y sin hacer fetchs adicionales.
* **Justificación**:
  * Evita "prop drilling" y múltiples llamadas a la base de datos. Si el admin cambia un flag o la configuración se refresca con `refreshConfig()`, toda la UI reacciona instantáneamente.

### 3. Blindaje Completo del Módulo ARCA
* **Diseño**:
  * **Panel Admin (`app/admin/page.tsx`)**: La tarjeta de acceso a "Facturación" tiene la propiedad `show: isEnabled("arca")`. Si está apagada, no se renderiza en el grid.
  * **Página de Facturación (`app/admin/facturacion/page.tsx`)**: Si un usuario intenta acceder por URL directa a `/admin/facturacion` con el flag apagado, se renderiza una pantalla de bloqueo ("Módulo No Disponible") con un botón de retorno al panel, evitando que cargue el componente `ArcaPage`.
  * **Tabla de Ventas (`components/sales/SalesTable.tsx`)**: La columna "Factura" y el modal de emisión solo se muestran si `isEnabled("arca")`.
  * **Modal de Registro de Ventas (`components/sales/RegisterSaleModal.tsx`)**: El toggle de emisión de factura electrónica solo se renderiza si `isEnabled("arca")`.
  * **Modal de Cobro de Turnos (`components/turnos/ServicePaidModal.tsx`)**: El checkbox y selector fiscal para emitir factura al cobrar un corte solo se muestran si `isEnabled("arca")`.
  * **Detalle del Turno (`components/turnos/AppointmentDetailsModal.tsx`)**: El botón de comprobante fiscal solo se muestra si `isEnabled("arca")`.
  * **Seguridad en Backend (`app/api/arca/emit/route.ts` y `/config/route.ts`)**: Se agregó validación con `await isServerFeatureEnabled("arca")` al inicio de cada endpoint. Si la flag está apagada, responde con HTTP 403 Forbidden.
* **Justificación**:
  * Se eliminó el uso obsoleto de la variable de entorno `process.env.NEXT_PUBLIC_ENABLE_ARCA`. Ahora la activación depende 100% de la base de datos de cada cliente, permitiendo que un cliente tenga facturación y otro no, usando el mismo código fuente.

### 4. Soporte de Slogan en Portada (`components/home/Hero.tsx`)
* **Diseño**:
  * El Hero ahora lee `businessSettings?.slogan`.
  * Si el local tiene configurado un slogan (ej. "100% CALAMAR" para Hooligans o una frase distintiva para Hellfish), lo renderiza con prioridad. Si no está configurado, muestra el texto descriptivo institucional por defecto.
* **Justificación**:
  * Permite que la portada de Hooligans mantenga exactamente su identidad actual sin tener código condicional cableado.

### 5. Resiliencia en la API de Configuración (`app/api/business-settings/route.ts`)
* **Diseño**:
  * Se reemplazó la lista fija de columnas en el `select()` por `.select("*")`.
* **Justificación**:
  * Si la API corre contra una base de datos de cliente que todavía no tiene la columna `features` o `slogan`, el query no falla con error `column does not exist`. Trae las columnas disponibles y el helper `isFeatureEnabled` se encarga de aplicar los defaults.

### 6. Incorporación de Fixes de UI rescatados
* **Diseño**:
  * En `styles/buttons.css`: Se incorporó la regla `.time-input::-webkit-calendar-picker-indicator` con filtro invertido y cursor pointer para que el icono del reloj nativo de WebKit sea visible en temas oscuros.
* **Justificación**:
  * Resuelve un problema de accesibilidad visual presente en temas dark de clientes.

---

## Verificación de Calidad
* Chequeo de tipos (`tsc --noEmit`): **Exitoso (0 errores)**.
* Linter de código (`next lint`): **Exitoso (0 warnings, 0 errores)**.
* Git: Cambios commiteados localmente en `feat/multi-cliente-config-flags` (sin push a remotos).

---

## Pendiente para la Fase 4
* Inicializar Supabase CLI en el base (`gestor-de-turnos`).
* Versionar el **Schema de Verdad** como migración inicial (`supabase/migrations/`).
* Escribir para cada cliente (`hooligans` y `hellfish`) su migración delta correspondiente hacia el estado verdad (sin ejecutarlas en producción).
* Preparar los comandos de `migration repair` y el workflow de GitHub Actions para despliegue automatizado.
* Brindar las instrucciones al usuario para crear el proyecto de Supabase de TESTING del cliente piloto.
