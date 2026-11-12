# Reglas y Guía para Agentes de IA en `gestor-de-turnos`

> **IMPORTANTE**: Todo agente que trabaje en este repositorio DEBE leer y respetar estas reglas antes de proponer cambios, fusionar ramas o desplegar código.
> 
> ⚠️ **Regla de Oro:** *"Si algo no está claro, revisá el código y lo que conversamos. Si seguís con dudas, preguntame. No inventes requisitos ni hagas cambios fuera de lo que te pedí."*

---

## 0. Stack y Comandos

- **Stack**: Next.js 15.5 (App Router, sin `pages/` ni `getServerSideProps`), React 19, TypeScript, Tailwind CSS v4, Supabase, Sentry, Vitest (unit) y Playwright (e2e). Deploy en Vercel.
- **Comandos**:
  ```bash
  npm run dev          # servidor de desarrollo
  npm run type-check   # verificación de tipos
  npm run lint         # ESLint
  npm test             # Vitest (unit)
  npm run build        # build de producción
  npm run test:e2e     # Playwright: abre navegador, solo si el usuario lo pide expresamente (sección 5)
  ```
- **Verificación estándar** al terminar un cambio: `type-check`, `lint` y `test`.

---

## 1. Arquitectura Central (Repositorio Único Multi-Cliente)

1. **Un solo repositorio de código:** `gestor-de-turnos` es el único repositorio fuente.
2. **Los clientes son solo deploys:** Cada cliente (Hellfish, Hooligans y futuros locales) posee:
   - Su propio proyecto en Vercel (conectado a la rama `release`).
   - Su propia base de datos aislada en Supabase.
3. **Cero código hardcodeado por cliente:** 
   - Diferencias de diseño, logos, colores, redes, horarios y datos fiscales residen en la tabla `business_settings` de su Supabase.
4. **Feature Flags para funcionalidades por plan:**
   - Toda funcionalidad nueva o diferenciada (ej: facturación fiscal ARCA) debe estar protegida por un Feature Flag definido en `lib/flags/index.ts`.
   - **Regla estricta:** Todo Feature Flag nuevo **debe nacer apagado por defecto** (`default: false`). Los clientes lo activan según su plan desde su base de datos.

---

## 2. Protocolo Obligatorio de Versionado (SemVer)

Antes de finalizar una tarea, crear un Pull Request o mergear a `main` o a `release`, el agente **DEBE** evaluar y ejecutar los siguientes pasos de versionado:

### Regla de Incremento Semántico (MAJOR.MINOR.PATCH)
* **PATCH (`1.1.X` -> `1.1.X+1`)**:
  - Corrección de bugs o hotfixes.
  - Ajustes cosméticos o de estilos que no añaden pantallas ni componentes nuevos.
  - Pequeñas optimizaciones de rendimiento o refactors internos.
* **MINOR (`1.X.0` -> `1.X+1.0`)**:
  - Nuevas funcionalidades, nuevas vistas o pantallas (ej. módulo ARCA, nuevo sistema de reportes).
  - Integración de nuevos endpoints o hooks que amplían las capacidades sin romper compatibilidad.
  - Nuevos Feature Flags en el sistema.
* **MAJOR (`X.0.0` -> `X+1.0.0`)**:
  - Cambios arquitectónicos que rompen compatibilidad hacia atrás.
  - Reestructuración masiva de base de datos o autenticación.

### Checklist del Agente al Cerrar Tarea o Preparar Merge / Release:
1. [ ] **Actualizar `package.json`**: Incrementar el campo `"version": "X.Y.Z"`.
2. [ ] **Actualizar `CHANGELOG.md`**: Registrar los cambios agrupados en `Agregado`, `Cambiado`, `Corregido` o `Eliminado` con la fecha actual.
3. [ ] **Verificar `lib/version.ts` y UI**: Asegurar que la versión se visualice correctamente en `components/admin/sections/AdminSidebar.tsx`.
4. [ ] **Git Tagging al mergear**: Al hacer merge hacia `main` o `release`, notificar y registrar el tag:
   ```bash
   git tag -a vX.Y.Z -m "Release vX.Y.Z: <resumen de cambios>"
   git push origin vX.Y.Z
   ```

---

## 3. Estrategia de Ramas

```
[feature/...] ──> [main] (Desarrollo y Testing Interno) ──> [release] (Producción Clientes)
```

* **`main`**: Rama de desarrollo activo e integración. El deploy de Vercel de `gestor-de-turnos` apunta a `main` y a su Supabase de pruebas.
* **`release`**: Rama de producción protegida. **Los Vercel de todos los clientes apuntan a `release`**.
  - Solo recibe merges desde `main` una vez probada la versión.
  - Al mergear `main` a `release`, se crea el tag correspondiente (`vX.Y.Z`) y Vercel despliega en simultáneo a todos los clientes.

---

## 4. Base de Datos y Migraciones

1. Nunca ejecutar DDL o mutaciones directas sin crear el archivo de migración versionado en `supabase/migrations/` (generado vía Supabase CLI).
2. **Principio de Retrocompatibilidad:** Las migraciones deben ser aditivas (añadir columnas o tablas con valores por defecto seguros). Nunca renombrar o eliminar columnas en el mismo paso en que el código aún las requiere.

---

## 5. Pruebas y Uso del Navegador (Chrome / Subagentes)

1. **Prohibición de tests exploratorios automáticos con Chrome:**
   - Los agentes **NO deben levantar instancias de Chrome ni ejecutar subagentes de navegador** para pruebas exploratorias o validaciones visuales por iniciativa propia.
   - Solo está permitido abrir el navegador o lanzar herramientas de navegación si el usuario lo solicita de forma **expresa y explícita** en su instrucción.
   - La verificación estándar debe realizarse a nivel de código mediante análisis estático y compilación (`type-check`, `lint` y `build`).

---

## 6. Diseño Responsivo y Cambios Visuales (Desktop + Mobile)

1. **Responsividad Dual Obligatoria (Desktop y Celular):**
   - Cada vez que se realice un cambio visual, nuevo componente, ajuste de layout o modificación de estilos, el agente **DEBE validar y diseñar contemplando que el cambio sea 100% soportado tanto para computadora (desktop) como para celular (mobile)**.
   - Se debe verificar meticulosamente:
     - Comportamiento de elementos flotantes, fijos y modales (evitar bloqueos de contexto de apilamiento con `position: fixed` dentro de ancestros con `backdrop-filter` o `transform`).
     - Áreas táctiles accesibles en mobile (mínimo 44x44px en controles interactivos).
     - Ausencia total de desborde horizontal (`overflow-x`) en pantallas compactas (320px - 390px).
     - Contraste y legibilidad de textos sobre fondos oscuros.

---

## 7. Claridad, Alcance y Comunicación con el Usuario

1. **"Si algo no está claro, revisá el código y lo que conversamos. Si seguís con dudas, preguntame. No inventes requisitos ni hagas cambios fuera de lo que te pedí."**
2. **Alcance Estricto:** Toda tarea debe ceñirse con precisión quirúrgica a lo solicitado. No inventar funcionalidades secundarias, controles no pedidos ni alterar estilos existentes que no formen parte del requerimiento puntual.

---

## 8. Redacción de Textos en la UI (Uso Estricto de Minúsculas / Sentence case)

1. **Prohibición de Title Case en español:**
   - **NO** escribir títulos, botones, badges, opciones de menú ni oraciones con mayúscula en cada palabra (estilo anglosajón o Title Case).
   - Únicamente debe llevar mayúscula la **primera letra** del texto o de la oración (Sentence case), salvo que contenga nombres propios, marcas o palabras/siglas reservadas (ej: ARCA, WhatsApp, UI, DNI, CUIT, etc.).
   - *Ejemplos correctos:* "Balance y liquidaciones", "Historial de pagos", "Gastos del local", "Gestión de turnos", "Medios de pago", "Dar adelanto", "Registrar gasto", "Confirmar pago".
   - *Ejemplos incorrectos:* "Balance y Liquidaciones", "Historial de Pagos", "Gastos del Salon", "Gestión de Turnos", "Medios de Pago", "Dar Adelanto", "Registrar Gasto", "Confirmar Pago".

---

## 9. Prohibición de Modales (No Popups / No Dialogs Flotantes)

1. **NO usar modales flotantes (`fixed inset-0`, popups, dialogs con backdrop oscuro):**
   - La arquitectura de la interfaz en `gestor-de-turnos` no utiliza modales emergentes para flujos de creación, edición o registro.
   - En su lugar, se debe utilizar el patrón estándar de vistas en pantalla/panel con botón de retorno (`viewMode: 'list' | 'create'`), tal como se implementa en `VentasSection` y `SaleSplitPanel`:
     - El componente cambia de estado (`viewMode === 'new-...'`) y muestra el formulario ocupando el área de contenido principal.
     - En la cabecera del formulario se incluye un botón de navegación con `<ArrowLeft className="w-4 h-4" />` y texto "Volver" para cancelar o regresar al listado.
     - Al completar exitosamente la acción, se regresa automáticamente a la vista de lista y se refrescan los datos.
   - Esto evita problemas de contexto de apilamiento (`z-index`), desbordes en dispositivos móviles y bloqueos de scroll.
2. **Única excepción:** las confirmaciones cortas de acciones destructivas o de sesión (por ejemplo cerrar sesión) pueden usar `components/ui/ConfirmModal.tsx`. No se usa para formularios ni flujos de creación o edición.

---

## 10. Estados de Carga en Botones (Uso Obligatorio de Loader2 / ActionButton / SaveButton)

1. **Prohibición de cambiar el texto a gerundios ("Guardando...", "Cargando..."):**
   - **NO** alterar la propiedad `name` ni el texto de los botones durante estados de carga (ej: reemplazar "Guardar cambios" por "Guardando...", "Sincronizar" por "Sincronizando...", etc.).
   - En su lugar, se debe utilizar:
     - La prop estándar `loading={...}` en componentes como `SaveButton` o `ActionButton`, los cuales internamente gestionan el estado y renderizan `<Loader2 className="w-5 h-5 animate-spin" />`.
     - En botones `<button>` personalizados, renderizar condicionalmente el icono `<Loader2 className="... animate-spin" />` en lugar del icono regular de la acción, manteniendo inalterado el texto del botón.
   - Esto evita saltos de ancho en el botón (layout shift), mantiene la coherencia visual con el resto del sistema y respeta la convención de diseño establecida.

---

## 11. Colores y Tokens de Marca

1. Los colores de marca viven en `styles/variables.css` (variables CSS como `--background`, `--accent`, etc.).
2. **Prohibido** escribir hexadecimales fijos (ej. `#FF0000`) dentro de componentes: usar los tokens, por ejemplo `bg-[var(--accent)]`.

---

## 12. Datos, API y Manejo de Errores

1. **Soft delete en turnos**: los turnos (`appointments`) nunca se borran con `.delete()`. Se marca `deleted_at = NOW()` y todos los listados y métricas filtran con `.is("deleted_at", null)`. (Barberos, productos, servicios y ventas hoy usan borrado físico: no cambiarlo sin pedido explícito.)
2. **Escrituras en el servidor**: las mutaciones pasan por `app/api/...`, que usa `supabaseAdmin` cuando necesita saltear RLS. El frontend nunca ejecuta DDL ni importa `supabaseAdmin`.
3. **Respuestas de la API**: usar `successResponse()` y `errorResponse(message, status)` de `@/lib/api/response` en los route handlers.
4. **Errores de base de datos**: try/catch con mensaje de fallback (`status 500`). Nunca mostrar al usuario stacks de Postgres sin procesar.
5. **Logs**: nada de `console.log()` sueltos en código de producción.
6. **Tipos**: los contratos viven en `@/lib/types` (`Appointment.ts`, `Sale.ts`, etc.). Si se agrega un campo a la base, actualizar su tipo en el mismo cambio.
7. **Textos al usuario** (alertas, toasts, mensajes): español claro y cortés (ej. "Turno eliminado con éxito"), respetando el sentence case de la sección 8.
