# Estado del Plan Multi-Cliente

- **Rama activa en gestor-de-turnos**: `feat/multi-cliente-config-flags`
- **Fase actual**: Fase 4 completada. Esperando aprobación para iniciar Fase 5.
- **Fases aprobadas**: Fase 0, Fase 1, Fase 2, Fase 3.
- **Fases completadas**: Fase 0, Fase 1, Fase 2, Fase 3, Fase 4.

## Resumen de Fases
- [x] **Fase 0**: Reconocimiento (solo lectura) — *Aprobada*
- [x] **Fase 1**: Diferencias de código (solo lectura) — *Aprobada*
- [x] **Fase 2**: Schema (dumps y definición de schema de verdad) — *Aprobada*
- [x] **Fase 3**: Flags y configuración en el base — *Aprobada*
- [x] **Fase 4**: Migraciones versionadas (Supabase CLI, inicial, deltas, CI/CD) — *Completada, esperando aprobación*
- [ ] **Fase 5**: Entorno de pruebas completo
- [ ] **Fase 6**: Migración a producción (bajo orden explícita)

## Decisiones y Acuerdos Consolidados
1. **Entorno Base**: `gestor-de-turnos` es el único repo y su Supabase actual es el entorno de testing y base de desarrollo.
2. **Schema en el Base**: Columnas `features` y `slogan` aplicadas con éxito en el Supabase de `gestor-de-turnos`.
3. **Migraciones Versionadas**: Creadas en `supabase/migrations/` (`initial_schema.sql` y `multicliente_delta.sql`).
4. **CI/CD y Scripts**: Configurado `.github/workflows/deploy-migrations.yml` y `scripts/apply-migrations.sh`.
