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
   Asegúrate de copiar o tener seteado el archivo `.env.local` con tus variables `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL` y tu Supabase Role Key.

3. **Ejecutar en Desarrollo (Local):**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador preferido.

4. **Compilar para Producción:**
   ```bash
   npm run build
   npm run start
   ```
