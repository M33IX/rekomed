#!/usr/bin/env sh
set -eu

BACKUP_DIR="${BACKUP_DIR:-./backups}"
CONTAINER="${POSTGRES_CONTAINER:-rekomed-postgres-1}"
DATABASE="${POSTGRES_DB:-rekomed}"
USER="${POSTGRES_USER:-rekomed}"
STAMP="$(date +%Y-%m-%d_%H-%M-%S)"

mkdir -p "$BACKUP_DIR"
docker exec "$CONTAINER" pg_dump -U "$USER" "$DATABASE" | gzip > "$BACKUP_DIR/rekomed_$STAMP.sql.gz"
find "$BACKUP_DIR" -name "rekomed_*.sql.gz" -mtime +14 -delete
