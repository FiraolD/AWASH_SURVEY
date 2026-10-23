#!/usr/bin/env bash
# Backup the awash_survey PostgreSQL database.
#
# Usage:
#   ./scripts/backup-db.sh                       # 14 days retention, ./backups
#   RETENTION=30 ./scripts/backup-db.sh
#   OUT_DIR=/var/backups/awash ./scripts/backup-db.sh

set -euo pipefail

OUT_DIR="${OUT_DIR:-./backups}"
RETENTION="${RETENTION:-14}"
PG_DUMP="${PG_DUMP:-pg_dump}"

ENV_FILE="$(dirname "$0")/../.env"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Cannot find $ENV_FILE" >&2
  exit 1
fi

DB_URL="$(grep -E '^DATABASE_URL=' "$ENV_FILE" | head -n1 | cut -d= -f2-)"
if [[ -z "$DB_URL" ]]; then
  echo "DATABASE_URL not found in .env" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"
STAMP="$(date +%Y-%m-%d_%H%M%S)"
FILE="$OUT_DIR/awash_survey_${STAMP}.sql"

echo "Backing up: $DB_URL"
echo "Writing to: $FILE"

"$PG_DUMP" \
  --dbname "$DB_URL" \
  --format plain \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  --file "$FILE"

if command -v gzip >/dev/null 2>&1; then
  gzip -f "$FILE"
  FILE="${FILE}.gz"
fi

SIZE="$(du -h "$FILE" | cut -f1)"
echo "Done. $FILE ($SIZE)"

if [[ "$RETENTION" -gt 0 ]]; then
  find "$OUT_DIR" -name "awash_survey_*.sql*" -type f -mtime "+$RETENTION" -print -delete
fi