# Documentacion Tecnica - CDATTG-WEB

Esta documentacion describe la arquitectura, backend, base de datos, despliegue y flujos de trabajo del proyecto `CDATTG-WEB`.

## Alcance

- Repositorio monorepo con:
  - `cdattg_web_frontend` (React + TypeScript + Vite)
  - `cdattg_web_golang` (API Go con Gin + GORM)
  - `docker-compose.yml` (orquestacion de servicios)
- Enfocada en onboarding, mantenimiento, escalabilidad y despliegue seguro.

## Como navegar esta documentacion

- Arquitectura:
  - `architecture/overview.md`
  - `architecture/system-design.md`
  - `architecture/diagrams.md`
- Backend:
  - `backend/structure.md`
  - `backend/services.md`
  - `backend/api.md`
- Base de datos:
  - `database/overview.md`
  - `database/schema.md`
  - `database/relationships.md`
- Despliegue:
  - `deployment/overview.md`
  - `deployment/docker.md`
  - `deployment/environments.md`
  - `deployment/production-safety.md`
- Workflows:
  - `workflows/development.md`
  - `workflows/testing.md`

## Convenciones usadas

- No se inventa informacion no presente en el codigo.
- Cuando algo no se puede confirmar solo por lectura estatica, se marca como **suposicion** o **pendiente de validacion**.
- Los ejemplos de comandos y arquitectura corresponden al estado actual del repositorio.
