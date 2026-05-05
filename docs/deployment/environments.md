# Despliegue - Entornos

## Politica de separacion de entornos

El proyecto debe operar con tres entornos aislados:

- `development`
- `staging`
- `production`

## Estado actual observado

- `development`: soportado y documentado.
- `production`: soportado via Docker Compose + Nginx host.
- `staging`: no se detecta configuracion dedicada versionada en el repo.

## Recomendacion de organizacion

Crear y mantener:

- `.env.development`
- `.env.staging`
- `.env.production`
- (Opcional) `docker-compose.override.yml` por entorno.

## Reglas de configuracion por entorno

- Secretos distintos por entorno (nunca reutilizar `JWT_SECRET` o passwords).
- Bases de datos fisicamente separadas por entorno.
- Dominios/subdominios separados por entorno.
- Politicas CORS separadas por entorno.
- Nunca usar defaults de seguridad en `production`.

## Checklist de promotion (staging -> production)

- Pruebas funcionales y smoke tests en staging.
- Migraciones probadas con respaldo previo.
- Backups validados y restaurables.
- Validacion de variables de entorno productivas.
- Ventana de despliegue definida con plan de rollback.
