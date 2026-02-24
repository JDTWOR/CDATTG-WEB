# Build stage
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Dependencias para compilación (opcional: git para módulos privados)
RUN apk add --no-cache ca-certificates

# Copiar go mod primero para aprovechar caché de capas
COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Compilar binario estático
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/cdattg-api .

# Stage final
FROM alpine:3.21

RUN apk add --no-cache ca-certificates tzdata
ENV TZ=America/Bogota

WORKDIR /app

# Copiar binario, authz y entrypoint
COPY --from=builder /app/cdattg-api .
COPY --from=builder /app/authz ./authz
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Directorio para reportes PDF (el volumen lo montará; entrypoint asigna permisos)
RUN mkdir -p /app/storage/asistencia_pdfs

EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
