# Guía de Versionado y Ciclo de Lanzamientos

Este documento detalla la política de versionado formal y el ciclo de vida de los despliegues en la arquitectura multi-cliente de **Gestor de Turnos**.

---

## 1. Principios de Versionado (SemVer)

El proyecto utiliza [Semantic Versioning 2.0.0](https://semver.org/):

```
v MAJOR . MINOR . PATCH
   1   .   1   .   0
```

- **MAJOR**: Cambios estructurales que rompen contratos de API o compatibilidad con versiones previas de la base de datos o front.
- **MINOR**: Nuevas funcionalidades o ampliaciones de módulos (ej. Facturación ARCA, nuevos reportes, filtros avanzados) que son 100% compatibles hacia atrás.
- **PATCH**: Corrección de defectos, bugs, parches de seguridad o ajustes menores de CSS/interfaz.

---

## 2. Dónde se Refleja la Versión

1. **`package.json`**: Fuente de verdad en el campo `"version"`.
2. **`next.config.ts`**: Inyecta `process.env.NEXT_PUBLIC_APP_VERSION = packageJson.version` en el bundle de compilación.
3. **`lib/version.ts`**: Exporta la constante tipada `APP_VERSION` para el consumo en componentes cliente y de servidor.
4. **UI del Panel de Administración (`components/admin/sections/AdminSidebar.tsx`)**:
   - Header del menú lateral en desktop.
   - Barra de navegación móvil en la parte superior.
   - Footer del menú lateral en desktop.
5. **`CHANGELOG.md`**: Registro cronológico de hitos, funcionalidades y correcciones.
6. **Git Tags**: Marcas inmutables en el repositorio de Git (`v1.0.0`, `v1.1.0`, etc.).

---

## 3. Flujo de Trabajo para un Lanzamiento (Paso a Paso)

Cuando una tanda de trabajo o nueva funcionalidad está lista en tu rama de trabajo o en `main`:

### Paso 1: Incrementar la versión
Podés usar npm para actualizar `package.json` automáticamente:
```bash
# Para un bugfix o ajuste menor:
npm version patch --no-git-tag-version

# Para una feature nueva:
npm version minor --no-git-tag-version

# Para un cambio mayor:
npm version major --no-git-tag-version
```

### Paso 2: Completar el `CHANGELOG.md`
Añadí la sección de la versión bajo la fecha actual:
```markdown
## [1.2.0] - AAAA-MM-DD
### Agregado
- ...
### Cambiado
- ...
### Corregido
- ...
```

### Paso 3: Merge a `release` y Tagging
1. Mergeá los cambios probados de `main` a la rama `release`:
   ```bash
   git checkout release
   git merge main
   ```
2. Creá el tag de Git correspondiente:
   ```bash
   git tag -a v1.2.0 -m "Release v1.2.0: Resumen de cambios"
   ```
3. Subí la rama y los tags:
   ```bash
   git push origin release --tags
   ```

### Paso 4: Despliegue Automático en Vercel
Vercel compilará la versión para todos los clientes conectados a la rama `release` al mismo tiempo. Cualquier funcionalidad que dependa de plan se activará o mantendrá apagada de acuerdo con el campo `features` en su base de datos Supabase.
