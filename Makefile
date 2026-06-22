# CDATTG - Makefile raíz (Docker + base de datos)
# Ejecutar desde el directorio donde está docker-compose.yml

BACKEND_DIR := cdattg_web_golang

# Variables para DB (por defecto; override con .env o export)
DB_USER ?= cdattg
DB_NAME ?= cdattg_web

# Nombre del volumen de Postgres (compose: <nombre_proyecto>_postgres_data)
COMPOSE_VOLUME_PREFIX ?= cdattg_go
POSTGRES_VOLUME := $(COMPOSE_VOLUME_PREFIX)_postgres_data

COMPOSE_LOCAL := docker compose -f docker-compose.yml -f docker-compose.local.yml

.PHONY: docker-up docker-down docker-local-up docker-local-down docker-local-setup db-drop-recreate db-seed db-reset db-fresh help

# Levantar stack (producción / .env de servidor)
docker-up:
	docker compose up -d --build

# Copiar .env.local.example -> .env si no existe
docker-local-setup:
	@test -f .env || cp .env.local.example .env

# Stack local: API por /api en nginx, TZ Bogotá, SMTP deshabilitado por defecto
docker-local-up: docker-local-setup
	$(COMPOSE_LOCAL) up -d --build

docker-local-down:
	$(COMPOSE_LOCAL) down

# Parar servicios y borrar volumen de Postgres (borra la DB por completo)
docker-down:
	docker compose down
	-docker volume rm $(POSTGRES_VOLUME) 2>/dev/null || true

# Solo dropear y recrear la base (sin borrar volumen; más rápido)
db-drop-recreate:
	docker compose exec -T postgres psql -U $(DB_USER) -d postgres -c "DROP DATABASE IF EXISTS $(DB_NAME);"
	docker compose exec -T postgres psql -U $(DB_USER) -d postgres -c "CREATE DATABASE $(DB_NAME);"

# Ejecutar migraciones + seed dentro del contenedor backend (no requiere Go en el host)
db-seed:
	docker compose run --rm --entrypoint /app/seed backend

# Borrar volumen, levantar de nuevo y ejecutar seed (reset completo)
db-reset: docker-down docker-up
	@echo "Esperando a Postgres..."
	@sleep 5
	$(MAKE) db-seed

# Dropear DB + seed (más rápido que db-reset; no borra el volumen)
db-fresh: db-drop-recreate db-seed

help:
	@echo "Comandos Docker / DB (ejecutar desde la raíz del proyecto):"
	@echo "  make docker-local-up    - Stack LOCAL (.env.local.example, proxy /api, :9080/:9081)"
	@echo "  make docker-local-down  - Detener stack local"
	@echo "  make docker-up          - Levantar stack (docker compose up -d --build)"
	@echo "  make docker-down        - Parar y borrar volumen de Postgres"
	@echo "  make db-drop-recreate  - Dropear y recrear la base (sin borrar volumen)"
	@echo "  make db-seed           - Ejecutar migraciones y seeders (dentro del contenedor)"
	@echo "  make db-fresh          - Dropear DB + migraciones + seed (rápido)"
	@echo "  make db-reset          - Borrar volumen, levantar y seed (reset completo)"
