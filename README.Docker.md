# Despliegue con Docker

Proyecto CDATTG (backend Go + frontend React) con PostgreSQL, Caddy (HTTPS) y acceso remoto a la base de datos.

## Subdominios

| Servicio | URL | Descripción |
|----------|-----|-------------|
| Frontend | https://academica.jhonrojas.online | App React |
| API      | https://apiacademica.jhonrojas.online | API Go |

## Requisitos

- Docker y Docker Compose
- Los DNS de `academica.jhonrojas.online` y `apiacademica.jhonrojas.online` deben apuntar a la IP del servidor donde se ejecuta Docker (puertos 80 y 443).

## Configuración

1. Copiar el archivo de entorno y definir contraseñas y secretos:

   ```bash
   cp .env.example .env
   # Editar .env: DB_PASSWORD, JWT_SECRET (obligatorios)
   ```

2. Asegurar que el script de PostgreSQL sea ejecutable (para permitir acceso remoto a la DB):

   ```bash
   chmod +x docker/postgres/01-allow-remote.sh
   ```

## Levantar el stack

```bash
docker compose up -d
```

Servicios:

- **postgres**: Puerto `5432` publicado; acepta conexiones remotas (usuario/contraseña según `.env`).
- **backend**: API Go (interno :8080); expuesto vía Caddy en `https://apiacademica.jhonrojas.online`.
- **frontend**: Build React con `VITE_API_BASE_URL`; servido por nginx (interno :80); expuesto vía Caddy en `https://academica.jhonrojas.online`.
- **caddy**: Reverse proxy; obtiene certificados HTTPS con Let's Encrypt automáticamente.

## Acceso remoto a PostgreSQL

Tras el primer `docker compose up`, la base de datos:

- Escucha en el puerto **5432** del host.
- Acepta conexiones desde cualquier IP (configurado en `docker/postgres/01-allow-remote.sh`).

Ejemplo desde otro equipo:

```bash
psql -h IP_DEL_SERVIDOR -p 5432 -U cdattg -d cdattg_web
```

Usar `DB_USER`, `DB_PASSWORD` y `DB_NAME` definidos en `.env`.

## Volúmenes

- `postgres_data`: datos de PostgreSQL.
- `backend_storage`: reportes PDF de asistencia.
- `caddy_data` / `caddy_config`: certificados y configuración de Caddy.

## Comandos útiles

```bash
# Ver logs
docker compose logs -f

# Reconstruir y levantar
docker compose up -d --build

# Ejecutar seeders (datos iniciales): ver documentación en cdattg_web_golang (cmd/seed).
```

## Notas HTTPS

- Caddy obtiene y renueva certificados Let's Encrypt de forma automática.
- Los dominios deben resolver a la IP del servidor antes del primer arranque para que la emisión de certificados funcione.
