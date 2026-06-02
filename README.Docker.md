# Despliegue con Docker

Proyecto CDATTG (backend Go + frontend React) con PostgreSQL. Nginx en el host hace de reverse proxy y SSL (Certbot); la API y el frontend se publican solo vía Nginx (contenedores en localhost).

## Subdominios (producción)

| Servicio | URL pública |
|----------|-------------|
| Frontend | `https://cdattg.dataguaviare.com.co` |
| API      | `https://apicdattg.dataguaviare.com.co` |

Los puertos internos del host (`9080`, `9081`) no deben exponerse a Internet; Nginx hace de proxy.

## Requisitos

- Docker y Docker Compose en el servidor.
- Nginx en el host (puertos 80 y 443) con Certbot para HTTPS.
- DNS de los dominios anteriores apuntando al servidor.

## Configuración

1. Copiar el archivo de entorno y definir secretos **solo en el servidor** (nunca en Git):

   ```bash
   cp .env.example .env
   # Editar .env: DB_PASSWORD, JWT_SECRET (obligatorios)
   # Ajustar CORS_ALLOWED_ORIGINS, VITE_API_BASE_URL y DB_PORT si aplica.
   ```

2. Si necesita acceso remoto a PostgreSQL (BI, reporting), revise `docs/deployment/conexiones-externas.md.example` y aplique restricción por IP en el servidor.

## Levantar el stack

```bash
docker compose up -d --build
```

Servicios:

- **postgres**: publicado en el host según `DB_PORT` del `.env` (ver `.env.example`).
- **backend**: `127.0.0.1:9081` (solo localhost).
- **frontend**: `127.0.0.1:9080` (solo localhost).

Nginx en el host debe hacer proxy a esos puertos (plantillas en `docker/nginx/`).

## Nginx en el VPS

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

3. Certificados SSL con Certbot:

   ```bash
   sudo certbot --nginx -d cdattg.dataguaviare.com.co -d apicdattg.dataguaviare.com.co
   ```

## Acceso remoto a PostgreSQL (resumen)

Solo habilítelo si hay necesidad real (p. ej. herramientas de reporting). Recomendaciones mínimas:

- Definir `DB_PORT` en `.env` del servidor; en VPS con varios proyectos Docker, **no asuma el puerto 5432** sin verificar (`ss -tlnp | grep postgres`).
- Restringir en firewall del proveedor **solo las IPs autorizadas**, no rangos abiertos.
- Preferir VPN o túnel SSH antes de exponer PostgreSQL a Internet.
- No versionar credenciales ni runbooks con IPs/usuarios reales.

Plantilla operativa (placeholders): `docs/deployment/conexiones-externas.md.example`.

El backend dentro de Docker usa el hostname `postgres` y el puerto interno `5432`; es independiente de `DB_PORT` publicado en el host.

## Volúmenes

- `postgres_data`: datos de PostgreSQL.
- `backend_storage`: reportes PDF de asistencia.

## Comandos útiles

```bash
docker compose logs -f
docker compose up -d --build
```

### Base de datos (Make, desde la raíz del proyecto)

| Comando | Descripción |
|---------|-------------|
| `make db-seed` | Migraciones y seeders (stack levantado). |
| `make db-fresh` | Recrea la base y ejecuta seed (**solo desarrollo**). |
| `make db-reset` | Borra volumen de Postgres y seed (**solo desarrollo**). |
| `make docker-up` | Levanta el stack. |
| `make docker-down` | Detiene servicios (puede eliminar volumen según configuración). |

> En **producción** no ejecute `db-fresh` ni `db-reset`. Ver `docs/deployment/production-safety.md`.

## Seguridad en documentación

- No subir `.env`, dumps de base ni runbooks con IPs, puertos reales o contraseñas.
- Los dominios públicos en este archivo son inevitables para despliegue; el resto de datos sensibles debe vivir en gestión interna (vault, wiki privada, `.env` en servidor).
