#!/usr/bin/env bash
# Backup PostgreSQL database (for portfolio project).
# Usage: ./scripts/backup-database.sh
# Requires: pg_dump on PATH. Loads DATABASE_URL from .env.local or .env.
# Backups are written to scripts/backups/ (created if missing).

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$SCRIPT_DIR/backups"
mkdir -p "$BACKUP_DIR"

if [ -f "$PROJECT_ROOT/.env.local" ]; then
  set -a
  source "$PROJECT_ROOT/.env.local"
  set +a
elif [ -f "$PROJECT_ROOT/.env" ]; then
  set -a
  source "$PROJECT_ROOT/.env"
  set +a
fi

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL not set. Add it to .env.local or .env"
  exit 1
fi

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/portfolio-$TIMESTAMP.sql"
echo "Backing up database..."
pg_dump "$DATABASE_URL" --no-owner --no-acl -f "$BACKUP_FILE"
echo "Backup saved: $BACKUP_FILE"
