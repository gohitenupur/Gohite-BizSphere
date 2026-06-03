#!/usr/bin/env bash
# Full database backup — ALL tables, no exclusions (POLICY §14)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${ROOT_DIR}/backups"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
OUTPUT="${BACKUP_DIR}/gohite_${TIMESTAMP}.sql"

if [ -z "${DATABASE_URL:-}" ]; then
  if [ -f "${ROOT_DIR}/.env" ]; then
    set -a
    # shellcheck source=/dev/null
    source "${ROOT_DIR}/.env"
    set +a
  fi
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set" >&2
  exit 1
fi

mkdir -p "${BACKUP_DIR}"
pg_dump "${DATABASE_URL}" --no-owner --no-acl -f "${OUTPUT}"
echo "Backup written to ${OUTPUT}"
