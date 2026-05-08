# Gestor de Turnos Inteligente ✂️

Bienvenido al sistema automatizado de reservas y gestión diseñado específicamente para barberías y centros estéticos modernos. Este software proporciona una experiencia *White-Label* (marca blanca) robusta, escalable y enfocada a conversiones rápidas desde dispositivos móviles, mientras dota a los administradores de un panel de mando seguro para controlar su calendario y métricas.

## Funcionalidades Principales
- **Para el Cliente:** Reserva interactiva e intuitiva de 3 pasos (Barbero ➔ Día/Hora ➔ Servicio).
- **Para el Barbero/Admin:** Calendario dinámico (`react-big-calendar`), gestión completa de turnos con *soft-delete*, métricas de recaudación financiera y atajos de atención vía WhatsApp Integrado.
- **Marca Blanca (Multi-tenant):** Soporta rápido "reskin" a través de variables CSS para clonarlo y lanzarlo a nuevos clientes velozmente.

## Stack Tecnológico 🛠️
- **Core / Framework:** Next.js (App Router, versión 15.2.x) y React 19.
- **Base de Datos & Auth (BaaS):** Supabase (PostgreSQL).
- **Estilos:** Tailwind CSS v4 complementado con CSS Modules y Variables Nativas.
- **Lenguaje:** TypeScript estricto.

## Comenzando el Entorno 🚀

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar el entorno:**
   Para desarrollo local, asegúrate de tener [Docker](https://www.docker.com/) corriendo y el [CLI de Supabase](https://supabase.com/docs/guides/cli) instalado (`brew install supabase/tap/supabase`).
   Verifica tu archivo `.env.local` para que apunte al entorno local (los keys de local te los dará Supabase al iniciarlo):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_local
   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_local
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_ENABLE_ARCA=false
   ```
   *(Nota: Puedes guardar tus credenciales reales en un archivo `.env.local.production` y reemplazar el `.env.local` cuando necesites probar contra producción).*

3. **Ejecutar la Base de Datos Local (Supabase):**
   En una terminal, levanta la instancia local:
   ```bash
   supabase start
   ```
   Esto descargará las imágenes de Docker, levantará la base de datos y aplicará las migraciones iniciales.
   - **Supabase Studio (Admin DB):** [http://127.0.0.1:54323](http://127.0.0.1:54323)
   - Para apagarla cuando termines: `supabase stop`

4. **Ejecutar el Frontend (Next.js):**
   En otra terminal, corre el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador preferido.

4. **Compilar para Producción:**
   ```bash
   npm run build
   npm run start
   ```
