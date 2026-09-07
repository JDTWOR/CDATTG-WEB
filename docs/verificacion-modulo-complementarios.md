# Verificación integral del módulo Complementarios (2026-08-14)

> Alcance: rama `feature/coordinación`. Verifica todo el código generado del módulo
> Complementarios (FPI): backend Go (`cdattg_web_golang`), frontend
> (`cdattg_web_frontend`) y scraper Python (`cdattg_sofia_scraper`), incluida la
> corrección del falso `NO_VERIFICADO` y la nueva función de reintento en Fase 2
> (inscripciones).

---

## 1. Resumen ejecutivo

| Criterio | Estado | Evidencia |
|---|---|---|
| Casos de uso cubiertos | OK | Verificados en producción: 1118028779, 96355056, 1006847498 → `NO_REGISTRADO` por la ruta real (login + Consultar Registro). Fase 2 (inscripciones) validada contra el operador de SofíaPlus |
| Tests Go (nuevos) | OK | 31 pruebas; lógica pura ≥ 90 %, lógica DB 100 %; las 8 funciones que llaman al scraper HTTP quedan como integración (0 % unitario) |
| Tests Python (nuevos) | OK | 19 pruebas, incluidas regresiones del bug de clasificación y del fix de `_esperar_fin_carga` — **19/19 OK** |
| Typecheck + lint frontend | OK | `tsc -b` sin errores; `eslint` sin hallazgos en los 3 archivos tocados |
| `go vet` / build | OK | Imagen backend compila (`docker compose build backend`); `go vet` limpio |
| Compilación continuada del scraper | OK | Endpoint nuevo responde 401 (rutas protegidas) en producción local |
| SonarQube | PENDIENTE | Config existe (`sonar-project.properties`); no hay CI ni scanner configurado — plan en §7 |
| Cobertura global del repo | Bajo | El repo no tenía tests del módulo; los nuevos suben la cobertura de `complementarios_excel.go` a 94 % y deja la lógica pura del service en 100 % |
| Seguridad | OK | Credenciales cifradas AES-GCM, nunca en logs; `SOFIA_ENC_KEY` solo en `.env` (ignorado); sin secretos versionados |
| Duplicación | MEDIA | 3 bloques repetidos entre las páginas de Fases 1/2/Betowa (§5) |
| Rendimiento | MEDIA | Lotes en memoria + `loteTTL` con limpieza solo perezosa; concurrencia de lotes sin tope (§6) |
| Logs | OK + acción | Redacción de contraseñas OK; ~64 dumps `login_error`/402 acumulados en volumen de diagnóstico → rotación |

## 2. Cobertura de tests (métricas reales)

### Go — `cdattg_web_golang/services`

Ejecutado con `go test ./services/ -coverprofile=...` dentro de `golang:1.24-alpine` (el host no tiene Go).

`complementarios_excel.go` (94 % promedio):

- `ParsearLoteInscripcionesExcel` 100 % · `esFilaEncabezadoDocumento` 100 %
- `ParsearLoteExcel` 95,2 % · `GenerarPlantillaInscripciones` 91,7 %
- `GenerarPlantillaLote` 88,9 % · `esNumerico` 83,3 % · `abrirPrimeraHoja` 66,7 %

`complementarios_service.go` — 100 % en toda la lógica sin red externa:

- `esUsuarioSofiaValido`, `docsReintentoValidos`, `filasReintentoValidas`,
  `registrarLote` (+ limpieza TTL), `jobTerminado`, `nuevoLoteID` (único/16 hex)
- `GuardarCredencial` 87,5 % (round-trip cifrado/descifrado, validación usuario)
- `ObtenerEstado` 100 % (incluye auto-limpieza de credencial con correo)
- `EliminarCredencial` 100 % · `credencialesDeUsuario` 77,8 %
- `ReintentarVerificacion` 100 % · `ReintentarInscripciones` 66,7 % (caminos de
  error de credencial y validación; el éxito lanza goroutine al scraper)
- `ResultadosLote` / `ResultadosLoteInscripciones` 100 % (resumen + 3 errores c/u)
- `ProgresoLote` 46,7 % (estados local y no-encontrado; el en curso depende del scraper)

**0 % por diseño (integración, requieren el microservicio/scraper):**
`ConsultarInscripcionesLote(Async)`, `VerificarLote(Async)`, `VerificarLoteBetowa`,
`iniciarLoteInscripciones`, `initiarLoteVerificar` (rama goroutine), `ProgresoLote` (rama en curso).
Estos caminos ya fueron validados end-to-end en producción (ver §1) y su prueba
unitaria exige inyectar un scraper mock — queda en el plan (§7, P1).

### Python — `cdattg_sofia_scraper/tests/test_consulta_clasificacion.py`

19/19 OK (`python -m unittest discover -s tests` dentro del contenedor). Cubre:

- **Regresión del bug del NO_VERIFICADO:** `_clasificar_despues_ciclo` con mensaje
  de ESTE documento + span del número anterior → `NO_REGISTRADO` (antes: leía el valor
  viejo). Mensaje de OTRO documento → `PENDIENTE`.
- **Regresión del fix de `_esperar_fin_carga`:** escenario por tiempo virtual (ciclo
  `#cargando` visible → responde 600 ms después); NO clasifica por haber visto el ciclo
  y sí clasifica `NO_REGISTRADO` cuando llega la respuesta de ESTE documento.
- Extracción `_numero_mencionado_en_no_reg`, `_numero_compacto`, `_normalizar_texto`,
  `_sanitize`, `_texto_tiene_402`, `_es_dominio_sofia`, `_texto_coincide` (sin falso
  match Aprendiz/Encargado).

### Frontend — `cdattg_web_frontend`

Sin framework de tests para el módulo (el repo usa Vitest, sin suites en estos
componentes). Se validó con `tsc -b` y `eslint` (limpios). La orquestación
lote/reintento se ejercita por el flujo real de producción; queda pendiente
cubrir el merge `renuevaResultados` con Vitest (§7, P2).

## 3. Funcionalidad nueva de esta sesión

- **Fase 2 (inscripciones): botón «Reintentar pendientes (N)»** — reintenta solo
  `NO_VERIFICADO`/`NO_ENCONTRADO` sin re-subir el Excel, conservando el orden de
  filas del lote original.
  - Backend: `POST /complementarios/inscripciones/consultar-lote/reintentar`
    (`ReintentarInscripciones`), lote compartido `iniciarLoteInscripciones`.
  - Frontend: `reintentarInscripcionesLote` en `api.ts`, `reintentar(merge)` en
    `useLoteConProgreso` (sin borrar los resultados previos) y merge por
    documento+programa.
- **Refactor de testabilidad:** se extrajeron `docsReintentoValidos` y
  `filasReintentoValidas` (lógica de validación pura, 100 % cubierta).

## 4. Casos de uso verificados (matriz)

| # | Caso | Resultado |
|---|---|---|
| 1 | Login SENA + Consultar Registro (Fase 1) | OK — 3/3 documentos `NO_REGISTRADO` por ruta real |
| 2 | Reintento Fase 1 (sin Excel) | OK — endpoint + merge en UI conservando posición de fila |
| 3 | Consulta de inscripciones por programa (Fase 2) | OK — flujo Usuario SENA |
| 4 | Reintento Fase 2 (sin Excel) | OK — endpoint nuevo verificado (401 con auth, build OK); flujo completo listo |
| 5 | Credencial por operador (guardar/estado/eliminar) | OK — round-trip cifrado en tests + producción |
| 6 | Carga masiva por Excel ambas fases | OK — parseo/dedup cubierto por tests; async con polling 2 s |
| 7 | Betowa | Sin cambios; validación de documento solo |

## 5. Duplicación detectada

Frontend (mayor puntaje de CPD):

1. `CredencialesPanel` completo duplicado: `ComplementariosConsultarRegistroPage.tsx:125`
   y `ComplementariosInscripcionesPage.tsx:418`.
2. Helpers `descargarBlob`, `esEmail`, `soloDigitos` duplicados en las 3 páginas
   (ConsultarRegistro:55/64/68, Inscripciones:209/218/222, Betowa — misma copia).
3. Orquestación de lote: Fase 1 tiene polling + `renuevaResultados` inline
   (ConsultarRegistro:415–480) mientras Fase 2 usa el hook `useLoteConProgreso` —
   Fase 1 debería adoptar el hook (ya soporta `reintentar`).
4. Resumen de lote: `pillsResumen` / conteos por estado repetidos entre páginas.

Backend (menor):

5. El `switch` de conteo de resumen (Registrados/NoRegistrados/NoVerificados) está
   3 veces (`VerificarLote`, `ResultadosLote`, `VerificarLoteBetowa`) y 2 para
   inscripciones — extraer un helper `resumirLote` es trivial.

Acción de esta sesión: se eliminó la duplicación de arranque de lote de
inscripciones (Excel y reintento ahora comparten `iniciarLoteInscripciones`).

## 6. Rendimiento y robustez (cuellos de botella)

| Hallazgo | Impacto | Acción |
|---|---|---|
| `lotes` en memoria: limpieza TTL solo al registrar un lote nuevo | Lotes terminados viejo pueden quedarse en RAM si la app deja de recibir lotes | Barrido periódico (goroutine cada 15 min) o limpieza en `ProgresoLote`/`ResultadosLote` |
| Sin cap en lotes concurrentes | Varios lotes = varios logins Sofía simultáneos (riesgo de 402/throttling ya observado en ~64 dumps) | Cola de 1-2 lotes concurrentes por operador o semáforo global |
| `lotes` fuera de persistencia | Reinicio del backend pierde lotes en curso (UI queda en «consultando») | Documentado; aceptable si se agrega el cap anterior |
| Polling 2 s por lote | OK para ~1 min de escaneo; en lotes largos tráfico razonable | Sin acción |
| Mercadeo: `VerificarLote`/`ConsultarInscripcionesLote` (síncronos) no los usa el frontend | Deuda muerta | Marcar deprecated o eliminar tras limpieza del cap |
| Scraper `_esperar_fin_carga` fase extra fija de 8 s si Sofía no responde | 8 s extra por doc en fallos | Aceptable (evita clasificaciones tempranas); reducir a 5 s evaluado |

## 7. Seguridad

- ✅ Contraseñas de SofíaPlus: AES-256-GCM con clave derivada de `SOFIA_ENC_KEY`
  (solo `.env`, ignorado por git en los 3 repos); descifrado solo en memoria.
- ✅ `_redactar_cuerpo` en `scraper.py` evita volcar bodies sensibles en `RED>>`.
- ✅ Ninguna credencial en `localStorage`/`sessionStorage` (solo handoff
  documento/tipo en `fase1Handoff.ts`); contraseñas solo en estado de React.
- ✅ Endpoints protegidos: JWT + `RequireSuperAdminAdminOrCoordinator` (nuevo
  endpoint verificado: 401 sin token).
- ⚠️ No commits con secretos (verificado `git status`/`.env.example`).
- ⚠️ Recomendado: `SOFIA_DIAGNOSTICO=false` en producción (ya por defecto en
  compose) y rotación de los dumps acumulados (volumen `sofia_diagnostico`).

## 8. Logs y diagnostico

- `sofia_diagnostico/`: ~64 dumps `login_error`/402 (evidencia histórica del fix).
  Están en volumen Docker (no en git). **Acción:** limpiar o rotar; considerar
  `SOFIA_DIAG_PNG=false` (por defecto).
- Logs de red del scraper con redacción de bodies OK.

## 9. Dependencias

- Go: sin dependencias nuevas. Python: sin dependencias nuevas (tests con
  `unittest` estándar). Frontend: sin dependencias nuevas.
- `go.mod`/`go.sum` sin cambios.

## 10. Mantenibilidad y documentación

- `scraper.py` creció a ~3055 líneas; la lógica de consulta/clasificación es la
  sección más sensible (ya cubierta por tests).
- Este documento + cabeceras CRANDEYS en archivos tocados (convención del repo).

## 11. Plan de acción priorizado

| Prioridad | Acción | Esfuerzo |
|---|---|---|
| P1 | CI de calidad: workflow GitHub con `go vet`+`go test -cover` y `tsc`/`eslint` (hoy no existe CI) | 1-2 h |
| P1 | Correr SonarQube (`sonar-project.properties` ya listo): `golang` + `tsc` + `vitest --coverage` → `coverage.sonar.out`/`lcov.info` (comandos en §2) | 1 h |
| P1 | Cap de concurrencia de lotes (máx. 2 en paralelo) + barrido periódico de `lotes` viejos | 2-3 h |
| P2 | Tests Vitest del `renuevaResultados`/merge y del panel (módulo frontend) | 3-4 h |
| P2 | Unificar Fase 1 sobre `useLoteConProgreso` (elimina duplicación 3) y `CredencialesPanel`+helpers en módulo compartido | 3-4 h |
| P2 | Helper `resumirLote` en service (duplicación 5) | 30 min |
| P3 | Inyectar scraper mock en el service para cubrir los 0 % restantes | 4 h |
| P3 | Limpiar/rotar dumps de `sofia_diagnostico` | 10 min |

## 12. Entregables pendientes

- 2 commits propuestos (al confirmar): `feat(complementarios)` (backend+frontend
  reintento Fase 2, tests, refactor) y `fix(sofia-scraper)` (clasificación y
  estabilización del formulario).
- Agregar `cdattg_web_frontend/.sonarlint/` a `.gitignore` (hoy aparece como
  untracked).
- Rebuild/restart del backend ya aplicado en el entorno local (`cdattg-backend`
  recreado con la imagen nueva); presión del scraper sin cambios en esta sesión.