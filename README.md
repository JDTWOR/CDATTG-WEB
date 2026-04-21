# CDATTG-WEB

Plataforma web para la gestion academica y administrativa del CDATTG (SENA), orientada al control de asistencias, administracion de personas, gestion de infraestructura y soporte a procesos de formacion complementaria.

Este repositorio centraliza:
- `cdattg_web_frontend`: interfaz web desarrollada con React + TypeScript.
- `cdattg_web_golang`: API REST desarrollada con Go (Gin + GORM).
- `docker-compose.yml`: orquestacion de servicios para despliegue en contenedores.

## Finalidad del proyecto

El objetivo principal es ofrecer un sistema integrado que permita:
- Gestionar usuarios, roles y permisos (RBAC) con autenticacion JWT.
- Registrar y consultar asistencias de aprendices e instructores.
- Administrar informacion de personas, sedes, ambientes y caracterizacion.
- Exponer una API robusta para ser consumida por el frontend y otros clientes.
- Facilitar despliegues consistentes en entornos de desarrollo y produccion.

## Arquitectura general

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS.
- **Backend**: Go 1.21+, Gin, GORM, JWT.
- **Base de datos**: PostgreSQL 16.
- **Infraestructura**: Docker Compose + Nginx (proxy reverso en host para produccion).

## Estructura del repositorio

```text
CDATTG-WEB/
├── cdattg_web_frontend/   # Aplicacion web (React)
├── cdattg_web_golang/     # API REST (Go/Gin)
├── docker/                # Configuracion de Docker y Nginx
├── docker-compose.yml     # Stack de contenedores
├── Makefile               # Comandos utiles para Docker y DB
└── README.Docker.md       # Guia detallada de despliegue en VPS
```

## Requisitos

- Docker y Docker Compose.
- Git.
- (Opcional para ejecucion local sin Docker)
  - Node.js 20+ y npm.
  - Go 1.21+.
  - PostgreSQL 12+.

## Inicio rapido con Docker (recomendado)

1. Crear archivo de entorno desde la plantilla:

```bash
cp .env.example .env
```

2. Configurar al menos las variables obligatorias en `.env`:
- `DB_PASSWORD`
- `JWT_SECRET`

3. Levantar servicios:

```bash
docker compose up -d --build
```

4. (Opcional) Ejecutar migraciones y seeders:

```bash
make db-seed
```

### Servicios levantados

- Frontend: `127.0.0.1:9080`
- Backend API: `127.0.0.1:9081`
- PostgreSQL: `localhost:5432`

## Desarrollo local por componentes

### Frontend (`cdattg_web_frontend`)

```bash
cd cdattg_web_frontend
npm install
cp .env.example .env
npm run dev
```

### Backend (`cdattg_web_golang`)

```bash
cd cdattg_web_golang
go mod download
go run main.go
```

> Para configuraciones especificas de cada componente, revisa sus respectivos `README.md`.

## Comandos utiles (raiz)

- `make docker-up`: levanta el stack con build.
- `make docker-down`: detiene servicios y elimina volumen de PostgreSQL.
- `make db-seed`: ejecuta migraciones + seed en el backend.
- `make db-fresh`: recrea base de datos y ejecuta seed.
- `make db-reset`: reset completo de la base de datos.

## Despliegue en VPS

La guia completa de despliegue con Nginx, SSL (Certbot), subdominios y acceso remoto a PostgreSQL esta en:

- `README.Docker.md`

## Estado del proyecto

Proyecto en evolucion activa. Se recomienda mantener sincronizados:
- cambios funcionales del backend,
- ajustes de consumo en frontend,
- y configuracion de entorno/despliegue.
