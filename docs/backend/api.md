# Backend - API

## Base URL

- Prefijo API: `/api`
- En Docker local:
  - Frontend: `http://127.0.0.1:9080`
  - Backend: `http://127.0.0.1:9081`

## Autenticacion

- Login publico:
  - `POST /api/auth/login`
- Endpoints protegidos (requieren `Authorization: Bearer <token>`):
  - `GET /api/auth/me`
  - `POST /api/auth/change-password`

## Modulos de endpoints (resumen)

- `personas`
- `programas-formacion`
- `catalogos`
- `fichas-caracterizacion`
- `instructores`
- `asistencias`
- `admin`
- `permisos`
- `usuarios`
- `aprendices`
- `infra`

## Seguridad de acceso

- Todas las rutas de negocio se montan bajo grupo protegido con `AuthMiddleware`.
- Adicionalmente se aplican validaciones de permiso con Casbin (`RequirePermission` y variantes).
- Algunas rutas usan reglas especiales (por rol o por contexto del usuario autenticado).

## Endpoint de websocket

- Ruta: `GET /api/asistencias/dashboard/ws`
- Estado observado: ruta publica en router.
- **Suposicion**: la validacion de token/permisos depende de logica interna del handler websocket.
- Recomendacion: validar explicitamente autenticacion y autorizacion al inicio del handshake.

## Contratos y versionado

- No se detecto versionado por prefijos como `/v1`.
- Recomendacion: formalizar versionado para cambios no retrocompatibles en API.
