# Build stage
FROM golang:1.24-alpine AS builder

WORKDIR /app

RUN apk add --no-cache ca-certificates

COPY go.mod go.sum ./
RUN go mod download

# Copia explícita del código fuente (evita COPY recursivo de archivos sensibles)
COPY main.go ./
COPY authz ./authz
COPY cmd ./cmd
COPY config ./config
COPY database ./database
COPY dto ./dto
COPY handlers ./handlers
COPY middleware ./middleware
COPY models ./models
COPY repositories ./repositories
COPY router ./router
COPY services ./services
COPY utils ./utils

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/cdattg-api .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/seed ./cmd/seed

# Stage final
FROM alpine:3.21

RUN apk add --no-cache ca-certificates tzdata && \
    mkdir -p /app/storage/asistencia_pdfs && \
    chown -R nobody:nogroup /app/storage && \
    chmod 750 /app/storage

ENV TZ=America/Bogota

WORKDIR /app

COPY --from=builder /app/cdattg-api /tmp/cdattg-api
COPY --from=builder /app/seed /tmp/seed
COPY --from=builder /app/authz /tmp/authz
COPY entrypoint.sh /tmp/entrypoint.sh

RUN sed -i 's/\r$//' /tmp/entrypoint.sh && \
    install -m 555 -o nobody -g nogroup /tmp/cdattg-api /app/cdattg-api && \
    install -m 555 -o nobody -g nogroup /tmp/seed /app/seed && \
    install -m 555 -o nobody -g nogroup /tmp/entrypoint.sh /entrypoint.sh && \
    mkdir -p /app/authz && \
    cp -a /tmp/authz/. /app/authz/ && \
    chown -R nobody:nogroup /app/authz && \
    find /app/authz -type f -exec chmod 444 {} \; && \
    find /app/authz -type d -exec chmod 555 {} \; && \
    rm -rf /tmp/cdattg-api /tmp/seed /tmp/authz /tmp/entrypoint.sh

USER nobody

EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
