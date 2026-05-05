# Backend - Estructura del Proyecto

## Stack backend

- Lenguaje: Go
- Framework HTTP: Gin
- ORM: GORM
- DB: PostgreSQL
- AuthN/AuthZ: JWT + Casbin

## Estructura de carpetas relevante

Base: `cdattg_web_golang`

- `main.go`: bootstrap de aplicacion.
- `config/`: carga de variables de entorno y configuracion.
- `database/`: conexion, migraciones y seeders.
- `router/`: registro central de endpoints.
- `middleware/`: CORS, autenticacion y permisos.
- `handlers/`: capa HTTP.
- `services/`: casos de uso y reglas.
- `repositories/`: capa de acceso a datos.
- `models/`: entidades y relaciones.
- `authz/`: inicializacion y helpers de Casbin.
- `utils/`: helpers transversales (JWT, password, etc.).

## Inicializacion de la aplicacion

En `main.go`:

1. Carga config (`config.LoadConfig()`).
2. Inicializa DB (`database.Initialize()`).
3. Inicializa Casbin (`authz.GetEnforcer(...)`).
4. Monta router (`router.SetupRouter()`).
5. Inicia servidor (`r.Run(host:port)`).

## Convenciones observadas

- Grupos de rutas por modulo dentro de `/api`.
- Uso de middleware de autenticacion para rutas protegidas.
- Uso de permisos por recurso/accion en la mayoria de endpoints.
- Servicios y repositorios separados por dominio funcional.

## Estado funcional importante

- El modulo de inventario esta referenciado en handlers/modelos, pero sus rutas no se registran y sus tablas no se migran actualmente.
