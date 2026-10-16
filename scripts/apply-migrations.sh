#!/usr/bin/env bash
# ==============================================================================
# Script para gestión y aplicación de migraciones versionadas en Supabase
# Uso:
#   ./scripts/apply-migrations.sh status <DB_URL>
#   ./scripts/apply-migrations.sh push <DB_URL>
#   ./scripts/apply-migrations.sh repair-applied <VERSION> <DB_URL>
# ==============================================================================

set -euo pipefail

COMMAND="${1:-help}"

case "$COMMAND" in
  status)
    DB_URL="${2:?Debe proveer la DB_URL}"
    echo "Consultando estado de migraciones en la base de datos..."
    npx supabase migration list --db-url "$DB_URL"
    ;;
  push)
    DB_URL="${2:?Debe proveer la DB_URL}"
    echo "Aplicando migraciones pendientes..."
    npx supabase db push --db-url "$DB_URL"
    ;;
  repair-applied)
    VERSION="${2:?Debe proveer la versión (ej: 20261016000000)}"
    DB_URL="${3:?Debe proveer la DB_URL}"
    echo "Marcando versión $VERSION como ya aplicada (repair applied)..."
    npx supabase migration repair --status applied "$VERSION" --db-url "$DB_URL"
    ;;
  repair-reverted)
    VERSION="${2:?Debe proveer la versión (ej: 20261016000000)}"
    DB_URL="${3:?Debe proveer la DB_URL}"
    echo "Marcando versión $VERSION como revertida (repair reverted)..."
    npx supabase migration repair --status reverted "$VERSION" --db-url "$DB_URL"
    ;;
  *)
    echo "Uso: $0 {status|push|repair-applied|repair-reverted} [args...] <DB_URL>"
    exit 1
    ;;
esac
