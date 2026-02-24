package main

import (
	"log"

	"github.com/sena/cdattg-web-golang/authz"
	"github.com/sena/cdattg-web-golang/config"
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/router"
)

func main() {
	// Cargar configuración
	config.LoadConfig()

	// Inicializar base de datos
	if err := database.Initialize(); err != nil {
		log.Fatal("Error inicializando base de datos:", err)
	}

	// Inicializar Casbin (carga políticas desde BD)
	if _, err := authz.GetEnforcer(database.GetDB()); err != nil {
		log.Fatal("Error inicializando Casbin:", err)
	}

	// Configurar router
	r := router.SetupRouter()

	// Iniciar servidor
	serverAddr := config.AppConfig.Server.Host + ":" + config.AppConfig.Server.Port
	log.Printf("Servidor iniciado en http://%s", serverAddr)
	
	if err := r.Run(serverAddr); err != nil {
		log.Fatal("Error iniciando servidor:", err)
	}
}
