# Guía de testing – API REST (Golang)

## Estructura

- **`handlers/*_test.go`**: tests unitarios de handlers con mocks de servicios (sin base de datos).
- **`router/router_test.go`**: tests de integración del router (rutas, binding, middleware).
- **`utils/*_test.go`**: tests unitarios de utilidades (password, etc.).
- **`testutil/`**: helpers compartidos para tests HTTP (request, recorder, assertions).

## Buenas prácticas aplicadas

- **Handlers**: inyección de dependencias mediante constructores `New*WithService(s)` para poder usar mocks en tests.
- **Tests por tabla**: casos en `[]struct` con `t.Run(tt.name, ...)` para mantener tests legibles y fáciles de ampliar.
- **Mocks por interfaz**: los handlers dependen de interfaces (`AuthService`, `PersonaService`, etc.), no de implementaciones concretas en tests.
- **Sin base de datos en tests unitarios**: los tests de handlers no usan BD; los de integración del router solo validan binding y rutas (no requieren BD para los casos actuales).
- **Config en tests de router**: `config.LoadConfig()` se ejecuta en `init()` de `router_test.go` para que el middleware CORS no falle.

## Ejecutar tests

```bash
# Todos los tests
go test ./...

# Solo handlers
go test ./handlers/ -v

# Solo router e integración
go test ./router/ -v

# Utilidades
go test ./utils/ -v

# Con cobertura
go test ./... -cover
```

## Añadir nuevos tests

1. **Nuevo handler**: crear `handlers/mi_handler_test.go`, definir un mock que implemente la interfaz del servicio y usar `NewMiHandlerWithService(mock)`.
2. **Nueva ruta**: añadir un caso en `router/router_test.go` o un test específico que haga `r.ServeHTTP(w, req)` y compruebe status/body.
3. **Helpers**: reutilizar `testutil.RecorderAndContext`, `testutil.AssertStatus`, `testutil.RequestWithBody` para requests y aserciones.
