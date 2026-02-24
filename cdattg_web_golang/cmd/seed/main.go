// Programa para ejecutar seeders (roles, permisos, personas, usuarios de prueba).
// Uso: go run ./cmd/seed
package main

import (
	"log"

	"github.com/sena/cdattg-web-golang/config"
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/database/seeders"
)

func main() {
	config.LoadConfig()
	if err := database.Initialize(); err != nil {
		log.Fatal("Error inicializando base de datos:", err)
	}
	if err := seeders.RunAll(); err != nil {
		log.Fatal("Error ejecutando seeders:", err)
	}
}
