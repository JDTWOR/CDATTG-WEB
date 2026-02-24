# Despliegue con Docker

Proyecto CDATTG (backend Go + frontend React) con PostgreSQL. Nginx en el host hace de reverse proxy y SSL (Certbot); los contenedores exponen solo en localhost.

## Subdominios (VPS Hostinger / Nginx)

| Servicio | URL | Puerto interno |
|----------|-----|----------------|
| Frontend | https://cdattg.dataguaviare.com.co | 9080 |
| API      | https://apicdattg.dataguaviare.com.co | 9081 |

## Requisitos

- Docker y Docker Compose en el servidor.
- Nginx en el host (puertos 80 y 443) con Certbot para HTTPS.
- DNS de `cdattg.dataguaviare.com.co` y `apicdattg.dataguaviare.com.co` apuntando a la IP del VPS.

## Configuración

1. Copiar el archivo de entorno y definir contraseñas y secretos:

   ```bash
   cp .env.example .env
   # Editar .env: DB_PASSWORD, JWT_SECRET (obligatorios)
   # Ajustar CORS_ALLOWED_ORIGINS y VITE_API_BASE_URL si usas otros dominios.
   ```

2. (Opcional) Script de PostgreSQL para acceso remoto a la DB:

   ```bash
   chmod +x docker/postgres/01-allow-remote.sh
   ```

## Levantar el stack

```bash
docker compose up -d --build
```

Servicios:

- **postgres**: Puerto `5432` publicado; acepta conexiones remotas (usuario/contraseña según `.env`).
- **backend**: API Go en `127.0.0.1:9081` (solo localhost).
- **frontend**: React servido por nginx en el contenedor; expuesto en `127.0.0.1:9080` (solo localhost).

Nginx en el host debe hacer proxy a esos puertos (ver plantillas en `docker/nginx/`).

## Nginx en el VPS

En el servidor, usar las plantillas que están en el repo:

1. Copiar y habilitar los sitios:

   ```bash
   sudo cp docker/nginx/cdattg.dataguaviare.com.co.example /etc/nginx/sites-available/cdattg.dataguaviare.com.co
   sudo cp docker/nginx/apicdattg.dataguaviare.com.co.example /etc/nginx/sites-available/apicdattg.dataguaviare.com.co

   sudo ln -s /etc/nginx/sites-available/cdattg.dataguaviare.com.co /etc/nginx/sites-enabled/
   sudo ln -s /etc/nginx/sites-available/apicdattg.dataguaviare.com.co /etc/nginx/sites-enabled/
   ```

2. Comprobar y recargar Nginx:

   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   ```

3. Obtener certificados SSL con Certbot (igual que en academica y el resto de sitios):

   ```bash
   sudo certbot --nginx -d cdattg.dataguaviare.com.co -d apicdattg.dataguaviare.com.co
   ```

Certbot modificará los archivos de sitio y añadirá `listen 443 ssl`, certificados y la redirección HTTP → HTTPS.

## Acceso remoto a PostgreSQL

Tras el primer `docker compose up`, la base de datos:

- Escucha en el puerto **5432** del host.
- Acepta conexiones desde cualquier IP si usas `docker/postgres/01-allow-remote.sh`.

Ejemplo desde otro equipo:

```bash
psql -h IP_DEL_SERVIDOR -p 5432 -U cdattg -d cdattg_web
```

Usar `DB_USER`, `DB_PASSWORD` y `DB_NAME` definidos en `.env`.

## Volúmenes

- `postgres_data`: datos de PostgreSQL.
- `backend_storage`: reportes PDF de asistencia.

## Comandos útiles

```bash
# Ver logs
docker compose logs -f

# Reconstruir y levantar
docker compose up -d --build

# Ejecutar seeders (datos iniciales): ver documentación en cdattg_web_golang (cmd/seed).
```

## Notas HTTPS

- SSL se gestiona con **Certbot** en Nginx (mismo esquema que academica, gibse, etc.).
- Los dominios deben resolver a la IP del VPS antes de ejecutar `certbot --nginx`.
