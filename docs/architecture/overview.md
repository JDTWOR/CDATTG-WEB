# Arquitectura - Vision General

## Resumen

El sistema sigue una arquitectura por capas en el backend Go:

- **Handler**: recibe peticiones HTTP y construye respuestas.
- **Service**: aplica reglas de negocio y coordina casos de uso.
- **Repository**: encapsula acceso a datos con GORM.
- **Model**: representa entidades y relaciones de base de datos.

Flujo principal:

1. Cliente (frontend) consume API REST.
2. Router de Gin enruta a handlers.
3. Handler delega en services.
4. Service usa repositories y utilidades (JWT, password, authz).
5. Repository persiste/consulta en PostgreSQL via GORM.

## Componentes principales

- Frontend:
  - `cdattg_web_frontend`
- Backend:
  - `cdattg_web_golang/main.go`
  - `cdattg_web_golang/router/router.go`
  - `cdattg_web_golang/handlers`
  - `cdattg_web_golang/services`
  - `cdattg_web_golang/repositories`
  - `cdattg_web_golang/models`
- Persistencia:
  - PostgreSQL 16 via Docker Compose
- Autorizacion:
  - Casbin + JWT

## Responsabilidades por capa

- **Router**: define rutas publicas/protegidas y middlewares.
- **Middleware**:
  - CORS
  - autenticacion JWT
  - autorizacion por permisos/roles (Casbin)
- **AuthZ**: inicializa enforcer y evalua permisos.
- **Database**: inicializa conexion y ejecuta migraciones automáticas.

## Suposiciones explicitas

- El modulo de inventario existe en codigo, pero esta desactivado en rutas y migraciones actuales.
- No se detecto pipeline CI/CD versionado en este repositorio.
