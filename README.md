# Gestor de Turnos Inteligente ✂️ — Documentación Técnica del Proyecto

Este repositorio contiene la plataforma de gestión de reservas y administración de turnos diseñada para barberías y centros estéticos. Está construida como una aplicación **Next.js (App Router)** moderna y reactiva, con tipado estricto en **TypeScript**, base de datos y autenticación provistas por **Supabase**, y estilos controlados mediante **Tailwind CSS** y variables nativas CSS.

Este documento sirve como la fuente de verdad técnica para cualquier desarrollador que se incorpore al proyecto. Aquí se detallan la estructura de código, los patrones de desarrollo, el modelo de seguridad, y las guías de configuración local.

---

## 📂 Estructura del Proyecto

El código está estructurado bajo los convenios estándar de Next.js App Router:

```bash
├── app/                      # Capa de presentación y ruteo (App Router)
│   ├── admin/                # Panel de administración (Rutas protegidas para Admin)
│   ├── api/                  # Endpoints de API locales (Route Handlers)
│   ├── barbers/              # Páginas de barberos específicas
│   ├── dashboard/            # Panel de control de personal y barberos (Rutas para Barbero/Admin)
│   ├── recuperar-contrasena/ # Formulario seguro de recuperación de claves
│   ├── layout.tsx            # Layout raíz de la aplicación (proveedores globales)
│   └── page.tsx              # Landing page principal y portal de reserva de clientes
├── components/               # Componentes de React reutilizables y modulares
│   ├── admin/                # Componentes específicos de administración (Modales de configuración)
│   ├── buttons/              # Botones reutilizables estilizados
│   ├── home/                 # Componentes de la página de aterrizaje (Hero, Servicios, etc.)
│   ├── input/                # Inputs de formulario controlados
│   ├── loading/              # Indicadores de carga (Spinners)
│   ├── turnos/               # Componentes del flujo de reservas y turnos
│   └── ui/                   # Componentes de interfaz puros sin lógica compleja (Modal, Footer, etc.)
├── docs/                     # Documentación técnica adicional y recursos
│   ├── ARCHITECTURE.md       # Diagramas y lógicas de red/datos
│   ├── arca.sql              # Scripts auxiliares para esquemas SQL
│   └── manual-usuario.html   # Manual de uso interactivo para clientes/personal
├── lib/                      # Capa lógica de negocio y utilidades
│   ├── auth/                 # Contexto de autenticación y lógica de sesiones (AuthContext)
│   ├── context/              # Contexto de variables dinámicas del negocio (BusinessContext)
│   ├── hooks/                # Custom hooks (e.g. control de popups, fechas)
│   ├── repository/           # Capa de repositorios asíncronos que conectan con la API interna
│   └── types/                # Contratos y tipos de TypeScript globales
├── public/                   # Recursos estáticos y configuración de PWA (manifest, sw.js)
├── styles/                   # Estilos CSS de la aplicación (variables, base, botones)
└── supabase/                 # Archivos de configuración local y migraciones de base de datos
```

---

## 🛠️ Arquitectura y Patrones de Código

Para mantener un código limpio, mantenible y escalable, el proyecto se rige por los siguientes pilares de arquitectura:

### 1. Desacoplamiento de Datos (Data-Fetching & Repositorios)
Evitamos que los componentes del cliente realicen consultas directas a la base de datos de Supabase. En su lugar, implementamos un patrón de red estructurado:
* **Route Handlers (`/app/api`):** Sirven como endpoints locales seguros. Utilizan credenciales privilegiadas (`supabaseAdmin`) para realizar mutaciones de base de datos en un entorno controlado y limpio.
* **Capa de Repositorios (`/lib/repository`):** Contiene funciones asíncronas tipadas (`getAppointments()`, `updateBusinessSettings()`, etc.) que realizan llamadas `fetch()` hacia los Route Handlers de Next.js.
* **Caché y Revalidación:** Los Route Handlers aprovechan el sistema de caché nativo de Next.js, utilizando `revalidateTag` o `revalidatePath` al realizar mutaciones para mantener el estado global de datos fresco y optimizado.

### 2. Personalización Visual Dinámica (Cero Hardcoding)
El sistema está diseñado para que todos sus valores de negocio (nombre, horarios, logotipo, etc.) sean dinámicos:
* **Contexto del Negocio (`lib/context/BusinessContext.tsx`):** Un Context Provider global que obtiene los datos desde `/api/business-settings` al iniciar la app. Mantiene en estado el nombre comercial y el logotipo.
* **Branding:** Cuando el administrador actualiza el logotipo o el nombre comercial, el archivo se sube a un Bucket seguro de *Supabase Storage*, el enlace se guarda en la base de datos y la función `refreshConfig()` del contexto refresca visualmente toda la web de forma reactiva sin necesidad de redespliegues.
* **Paleta de Colores Externa:** Todos los estilos y gradientes se basan en **Variables CSS nativas** centralizadas en [styles/variables.css](file:///Users/mauriciooubina/Desktop/Workspace/gestor-de-turnos/styles/variables.css). Para realizar un "reskin" de la aplicación, solo hace falta editar estas variables CSS (e.g. `--accent`, `--primary`, `--background`).

### 3. Modelo de Seguridad y Validación de Rutas (Multicapa)
Para proteger la integridad de los datos financieros, personales y de agenda, implementamos una estrategia de seguridad multicapa:
* **Capa de Servidor (`middleware.ts`):** Protege las rutas raíz `/admin` y `/dashboard` (y sus subrutas). Comprueba si existe un token de sesión válido usando `supabase.auth.getUser()` en el servidor. Si no existe, realiza una redirección segura a `/` impidiendo que se descargue código de páginas privadas.
* **Capa de Cliente (Layout Guards):** Los archivos [app/admin/layout.tsx](file:///Users/mauriciooubina/Desktop/Workspace/gestor-de-turnos/app/admin/layout.tsx) y [app/dashboard/layout.tsx](file:///Users/mauriciooubina/Desktop/Workspace/gestor-de-turnos/app/dashboard/layout.tsx) encapsulan a todas las subrutas cliente:
  * El guard de `/admin` restringe el paso si `role !== 'admin'`.
  * El guard de `/dashboard` restringe el paso si `role !== 'admin' && role !== 'barber'`.
  * Si el contexto de autenticación asíncrono está resolviendo el rol del usuario, muestra un componente de carga (`Spinner`) evitando destellos de información sensible, y redirige mediante `router.replace("/")` si no se cumplen los requisitos.
* **Guard de Recuperación de Contraseña (`app/recuperar-contrasena`):** Realiza un chequeo inmediato en el montaje mediante `auth.getSession()`. Si no hay una sesión activa de restauración, redirige de inmediato al inicio.

### 4. Soporte PWA (Progressive Web App)
La aplicación cuenta con soporte PWA nativo configurado mediante:
* **Manifiesto (`public/manifest.json`):** Define el comportamiento móvil: nombres de la app, iconos del home y el modo de visualización `"standalone"` para correr en pantalla completa.
* **Service Worker (`public/sw.js`):** Gestiona la caché estática de archivos clave, acelerando la velocidad de carga y permitiendo el acceso rápido.

### 5. Control de Base de Datos Local e Independencia de Migraciones
Para permitir que múltiples desarrolladores o implementaciones individuales trabajen con el repositorio sin interferencias en las estructuras de la base de datos de producción:
* El archivo `supabase/.gitignore` incluye la carpeta `migrations/`.
* Esto previene que las migraciones locales creadas por el CLI de Supabase sean trackeadas o subidas al repositorio de Git, manteniendo el repositorio limpio y delegando la migración del esquema a procesos de CI/CD independientes o bases de datos aisladas.

---

## 🚀 Configuración y Despliegue Local

Sigue estos pasos para levantar el entorno de desarrollo local en tu máquina:

### 1. Clonar el repositorio e instalar dependencias
Asegúrate de contar con Node.js (versión 18 o superior recomendada) instalado:
```bash
npm install
```


### 2. Configurar la Base de Datos Local (Supabase CLI)
El proyecto está configurado para correr opcionalmente contra una base de datos local usando [Docker](https://www.docker.com/) y el CLI de Supabase:
1. Instala el CLI de Supabase (e.g. `brew install supabase/tap/supabase` en macOS).
2. Asegúrate de tener Docker corriendo en tu sistema.
3. Levanta la instancia local desde la terminal:
   ```bash
   supabase start
   ```
   Esto levantará los contenedores de Postgres, Auth, Storage, y habilitará el panel de administración local en [http://127.0.0.1:54323](http://127.0.0.1:54323).

### 3. Configurar Variables de Entorno
Crea un archivo `.env.local` en la raíz del proyecto y completa las siguientes credenciales (puedes tomar de referencia las credenciales locales provistas por `supabase start`):
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_local
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_local
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Ejecutar el Entorno de Desarrollo
Una vez configuradas las variables, arranca el servidor de desarrollo de Next.js:
```bash
npm run dev
```
La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

---

## 🛠️ Scripts Disponibles en el Workspace

* **`npm run dev`**: Arranca el servidor de desarrollo de Next.js con recarga en vivo.
* **`npm run type-check`**: Valida todos los archivos TypeScript ejecutando el compilador de forma estricta (`tsc --noEmit`). **Ejecutar antes de cualquier commit**.
* **`npm run lint`**: Analiza la calidad del código Next.js buscando errores estáticos y malas prácticas.
* **`npm run build`**: Compila la aplicación optimizándola para producción.
* **`npm run start`**: Ejecuta la versión de producción ya compilada a nivel local.
* **`npm run test:e2e`**: Corre las pruebas de integración extremo a extremo utilizando Playwright.
