# Estado del Plan Multi-Cliente

- **Rama activa en gestor-de-turnos**: `feat/multi-cliente-config-flags`
- **Fase actual**: Fase 4 (Migraciones versionadas con Supabase CLI) en ejecución.
- **Fases aprobadas**: Fase 0, Fase 1, Fase 2, Fase 3.
- **Fases completadas**: Fase 0, Fase 1, Fase 2, Fase 3.

## Resumen de Fases
- [x] **Fase 0**: Reconocimiento (solo lectura) — *Aprobada*
- [x] **Fase 1**: Diferencias de código (solo lectura) — *Aprobada*
- [x] **Fase 2**: Schema (dumps y definición de schema de verdad) — *Aprobada*
- [x] **Fase 3**: Flags y configuración en el base — *Aprobada*
- [ ] **Fase 4**: Migraciones versionadas (Supabase CLI, inicial, deltas, CI/CD) — *En progreso*
- [ ] **Fase 5**: Entorno de pruebas completo
- [ ] **Fase 6**: Migración a producción (bajo orden explícita)

## Decisiones y Acuerdos Consolidados
1. **Schema de Verdad consolidado**: Estructura canónica con todas las entidades del base más `features` (`jsonb`) y `slogan` (`text`).
2. **Cliente Piloto**: `hellfish-barber-studio`.
3. **Módulo ARCA**: Blindado por feature flag por defecto apagado (`false`).
4. **Objetivo Fase 4**: Inicializar migraciones versionadas, crear migración inicial y deltas, documentar migration repair y CI/CD, y validar en Supabase de testing.
