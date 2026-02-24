#!/bin/sh
set -e
mkdir -p /app/storage/asistencia_pdfs
chown -R nobody:nogroup /app/storage 2>/dev/null || true
exec su nobody -s /bin/sh -c "exec /app/cdattg-api"
