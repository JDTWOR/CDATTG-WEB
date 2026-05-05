# Despliegue - Docker

## Servicios en `docker-compose.yml`

- **postgres**
  - Imagen: `postgres:16-alpine`
  - Volumen: `postgres_data`
  - Puerto host: `${DB_PORT}:5432`
- **backend**
  - Build desde `cdattg_web_golang/Dockerfile`
  - Puerto host: `127.0.0.1:9081:8080`
  - Volumen: `backend_storage`
- **frontend**
  - Build desde `cdattg_web_frontend/Dockerfile`
  - Puerto host: `127.0.0.1:9080:80`

## Dockerfile backend (Go)

- Multi-stage build (compilacion + runtime liviano).
- Genera binarios `cdattg-api` y `seed`.
- Usa `entrypoint.sh` y ejecuta app con usuario no root (`nobody`).

## Dockerfile frontend (React)

- Build con Node.
- Runtime con Nginx.
- Usa `VITE_API_BASE_URL` para apuntar a la API.

## Ejecucion local con Docker

1. Copiar variables:

```bash
cp .env.example .env
```

2. Ajustar secretos obligatorios:

- `DB_PASSWORD`
- `JWT_SECRET`

3. Levantar servicios:

```bash
docker compose up -d --build
```

4. Cargar datos base (opcional):

```bash
make db-seed
```

## Operacion en produccion (Docker + Nginx host)

- Mantener frontend/backend en localhost.
- Publicar solo Nginx (80/443) en host.
- Configurar certificados TLS con Certbot.
- Evitar exponer puertos administrativos innecesarios.
