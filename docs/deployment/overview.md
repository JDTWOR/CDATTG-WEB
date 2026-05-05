# Despliegue - Vision General

## Modelo de despliegue actual

El repositorio contiene un despliegue basado en Docker Compose con tres servicios:

- `postgres` (PostgreSQL)
- `backend` (API Go)
- `frontend` (Nginx sirviendo build React)

Los puertos de `backend` y `frontend` se publican solo en `127.0.0.1`, y Nginx en host actua como reverse proxy para dominios publicos.

## Artefactos relevantes

- `docker-compose.yml`
- `README.Docker.md`
- `cdattg_web_golang/Dockerfile`
- `cdattg_web_frontend/Dockerfile`
- `docker/nginx/*.example`

## Flujo operativo resumido

1. Preparar `.env` en raiz.
2. Levantar stack con `docker compose up -d --build`.
3. Ejecutar migraciones/seeders segun necesidad (`make db-seed`).
4. Configurar Nginx host y TLS con Certbot.

## Estado de madurez

- Despliegue manual documentado: **si**.
- Separacion explicita por archivos de entorno (dev/staging/prod): **parcial**.
- CI/CD versionado en repo: **no detectado**.
