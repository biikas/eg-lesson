#!/usr/bin/env bash
# Nightly backup (cron): DB dump + uploads, keeps 14 days. Reads DB credentials from ~/.eglesson-backup.cnf ([client] user/password).
set -euo pipefail
OUT=/var/backups/eglesson; STAMP=$(date +%F)
mkdir -p "$OUT"
mysqldump --defaults-extra-file="$HOME/.eglesson-backup.cnf" --single-transaction --routines eglesson | gzip > "$OUT/eglesson-$STAMP.sql.gz"
tar -czf "$OUT/uploads-$STAMP.tar.gz" -C /home/mbank/eglesson uploads 2>/dev/null || true
find "$OUT" -type f -mtime +14 -delete
