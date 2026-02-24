#!/bin/bash
set -e
# Permitir conexiones remotas a PostgreSQL (md5/scram-sha-256 desde cualquier IP)
echo "host all all 0.0.0.0/0 scram-sha-256" >> "$PGDATA/pg_hba.conf"
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "SELECT pg_reload_conf();"
echo "PostgreSQL: acceso remoto habilitado."
