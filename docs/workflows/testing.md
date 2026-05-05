# Workflows - Testing

## Objetivo

Garantizar estabilidad funcional, seguridad de cambios y confianza en despliegues.

## Estado actual observado

- Backend Go con pruebas unitarias/integracion puntuales (`go test ./...`).
- Frontend con lint y build disponibles.
- No se detecta pipeline CI/CD versionado en repo.

## Estrategia recomendada por niveles

- **Unit tests (backend)**:
  - services y utilidades (logica de negocio y reglas).
- **Integration/API tests (backend)**:
  - handlers + middleware + DB de prueba.
- **Frontend tests**:
  - componentes criticos y flujos de UI de alto impacto.
- **Smoke tests de despliegue**:
  - login, consulta de catalogos, flujo basico de asistencia.

## Comandos operativos actuales

Backend:

```bash
cd cdattg_web_golang
go test ./...
go test -cover ./...
```

Frontend:

```bash
cd cdattg_web_frontend
npm run lint
npm run build
```

## Politica minima antes de merge

- Linter en verde.
- Build en verde (frontend/backend).
- Pruebas de backend ejecutadas.
- Validacion manual de endpoint/flujo tocado.
- Si hay migracion: prueba de upgrade y rollback en staging.

## Cobertura sugerida por modulo

- Auth y permisos.
- Personas e importaciones.
- Fichas/asignaciones.
- Asistencias y reglas de estado.
- Infraestructura y catalogos base.

## Nota de alcance

Este repositorio no es Laravel/PHPUnit; la estrategia aqui descrita aplica al stack real actual (Go + React + PostgreSQL).
