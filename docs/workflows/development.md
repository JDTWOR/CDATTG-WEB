# Workflows - Desarrollo

## Setup local recomendado

## Opcion A: Docker (preferida)

```bash
cp .env.example .env
docker compose up -d --build
make db-seed
```

## Opcion B: Componentes por separado

Frontend:

```bash
cd cdattg_web_frontend
npm install
cp .env.example .env
npm run dev
```

Backend:

```bash
cd cdattg_web_golang
go mod download
go run main.go
```

## Estrategia de ramas (recomendada)

Propuesta simple y mantenible:

- `main`: produccion.
- `develop` (opcional): integracion previa a release.
- `feature/*`: nuevas funcionalidades.
- `fix/*`: correcciones.
- `hotfix/*`: correcciones urgentes a produccion.

Si no se usa `develop`, aplicar trunk-based con PRs pequenos hacia `main`.

## Buenas practicas de code review

- PRs pequenos y enfocados.
- Describir contexto, solucion y riesgos.
- Incluir evidencia de pruebas.
- Verificar impacto en seguridad y migraciones.
- Evitar mezclar refactor y cambios funcionales grandes en un mismo PR.

## Convenciones operativas

- No commitear secretos ni archivos `.env`.
- Mantener README y docs sincronizados con cambios de arquitectura.
- Para cambios de esquema, incluir migracion y plan de rollback.
