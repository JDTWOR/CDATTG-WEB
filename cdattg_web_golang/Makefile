.PHONY: run build test clean deps migrate

# Variables
BINARY_NAME=cdattg-web-golang
MAIN_PATH=main.go

# Ejecutar la aplicación
run:
	go run $(MAIN_PATH)

# Compilar la aplicación
build:
	go build -o $(BINARY_NAME) $(MAIN_PATH)

# Ejecutar tests
test:
	go test ./...

# Ejecutar tests con cobertura
test-coverage:
	go test -cover ./...

# Limpiar archivos compilados
clean:
	go clean
	rm -f $(BINARY_NAME)

# Descargar dependencias
deps:
	go mod download
	go mod tidy

# Formatear código
fmt:
	go fmt ./...

# Verificar código
vet:
	go vet ./...

# Instalar herramientas de desarrollo
install-tools:
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest

# Linter
lint:
	golangci-lint run

# Migraciones (si se implementan)
migrate:
	@echo "Migraciones no implementadas aún"

# Ayuda
help:
	@echo "Comandos disponibles:"
	@echo "  make run          - Ejecutar la aplicación"
	@echo "  make build        - Compilar la aplicación"
	@echo "  make test         - Ejecutar tests"
	@echo "  make test-coverage - Ejecutar tests con cobertura"
	@echo "  make clean        - Limpiar archivos compilados"
	@echo "  make deps         - Descargar dependencias"
	@echo "  make fmt          - Formatear código"
	@echo "  make vet          - Verificar código"
	@echo "  make lint         - Ejecutar linter"
