# Estado del Plan Multi-Cliente

- **Rama activa en gestor-de-turnos**: `main` (desarrollo) → `release` (producción clientes). La rama `feat/multi-cliente-config-flags` ya fue integrada.
- **Fase actual**: Fase 5 (Entorno de pruebas completo) en ejecución.
- **Fases aprobadas**: Fase 0, Fase 1, Fase 2, Fase 3, Fase 4.
- **Fases completadas**: Fase 0, Fase 1, Fase 2, Fase 3, Fase 4.

## Resumen de Fases
- [x] **Fase 0**: Reconocimiento (solo lectura) — *Aprobada*
- [x] **Fase 1**: Diferencias de código (solo lectura) — *Aprobada*
- [x] **Fase 2**: Schema (dumps y definición de schema de verdad) — *Aprobada*
- [x] **Fase 3**: Flags y configuración en el base — *Aprobada*
- [x] **Fase 4**: Migraciones versionadas (Supabase CLI, inicial, deltas, CI/CD) — *Aprobada*
- [ ] **Fase 5**: Entorno de pruebas completo — *En progreso*
- [ ] **Fase 6**: Migración a producción (bajo orden explícita)

## Decisiones y Acuerdos Consolidados
1. **Estrategia Multi-Cliente**: Un único repositorio de código (`gestor-de-turnos`), cada cliente es solo un deploy (su propio Vercel y su propio Supabase).
2. **Entorno Base de Testing**: `gestor-de-turnos` con su Vercel y Supabase actuales.
3. **Fase 5 en curso**: Definición de estrategia de ramas, conexión de variables y validación visual/funcional del cliente piloto Hellfish mediante checklist.
