# Arquitectura - Diseno del Sistema

## Capas y flujo de datos

El backend implementa separacion de responsabilidades:

- `router`: declaracion de endpoints y montaje de grupos.
- `middleware`: CORS, autenticacion y autorizacion.
- `handlers`: validacion basica de request/response HTTP.
- `services`: logica de negocio, reglas y orquestacion.
- `repositories`: consultas y operaciones con GORM.
- `models`: definicion de esquema relacional y asociaciones.

Flujo de una solicitud autenticada:

1. Request entra por `/api/*`.
2. Middleware valida JWT y carga usuario en contexto.
3. Middleware de permiso valida `obj` y `act` en Casbin.
4. Handler procesa payload y llama al service.
5. Service ejecuta reglas y usa repositorio(s).
6. Repository opera en PostgreSQL.
7. Handler retorna respuesta JSON con codigo HTTP.

## Modulos funcionales principales

- Autenticacion y gestion de usuarios/permisos.
- Personas (CRUD, importacion y gestion de credenciales).
- Programas y fichas de caracterizacion.
- Instructores y aprendices.
- Asistencias y dashboard (incluye websocket).
- Infraestructura (sedes, bloques, pisos, ambientes).
- Complementarios.

## Seguridad aplicativa (backend)

- JWT para autenticacion.
- Casbin para autorizacion RBAC por permiso.
- Endpoints agrupados en rutas protegidas con `AuthMiddleware`.
- Permisos granulares por recurso y accion (ej. ver/crear/editar/eliminar).

## Riesgos tecnicos observados

- El websocket de dashboard se expone en ruta publica y su control depende del manejo interno del handler.
- Existen defaults inseguros en configuracion si no se proveen variables de entorno (ej. `JWT_SECRET`, `DB_PASSWORD`).
- Inventario parcialmente presente en codigo, pero sin activacion completa en runtime.
