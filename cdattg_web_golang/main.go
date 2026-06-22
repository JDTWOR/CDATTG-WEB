package main

import (
	"log"

	"github.com/sena/cdattg-web-golang/authz"
	"github.com/sena/cdattg-web-golang/config"
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/database/seeders"
	"github.com/sena/cdattg-web-golang/router"
	"github.com/sena/cdattg-web-golang/utils"
)

func initAppLocation() {
	utils.InitAppLocation()
}

func main() {
	// Cargar configuración
	config.LoadConfig()
	initAppLocation()

	// Inicializar base de datos
	if err := database.Initialize(); err != nil {
		log.Fatal("Error inicializando base de datos:", err)
	}
	if err := database.EnsureSchemaPatches(); err != nil {
		log.Fatal("Error aplicando parches de esquema:", err)
	}
	if err := seeders.SyncEleccionPermissionsToRoles(database.GetDB()); err != nil {
		log.Fatal("Error sincronizando permisos de elecciones:", err)
	}
	if err := seeders.RunFestivosColombiaSeeder(database.GetDB()); err != nil {
		log.Fatal("Error sembrando festivos Colombia:", err)
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
