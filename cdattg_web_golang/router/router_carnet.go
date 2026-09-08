/**
 * Registro las rutas del carnet digital y de la foto de perfil.
 * Las puse aparte para no seguir creciendo el router grande.
 *
 * @author Cristian Deysdayr Jiménez
 */
package router

import (
	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/handlers"
	"github.com/sena/cdattg-web-golang/middleware"
	"github.com/sena/cdattg-web-golang/services"
	"gorm.io/gorm"
)

const permVerCarnetDigital = "VER CARNET DIGITAL"
const permValidarCarnetDigital = "VALIDAR CARNET DIGITAL"
const permVerCarnetBiblioteca = "VER CARNET BIBLIOTECA"
const permConfigurarCarnet = "CONFIGURAR CARNET"
const rutaMiFoto = "/mi-foto"

func registerPersonaFotoYCarnet(protected *gin.RouterGroup, personas *gin.RouterGroup, db *gorm.DB) {
	fotoHandler := handlers.NewPersonaFotoHandler()
	personas.GET(rutaMiFoto, fotoHandler.VerMiFoto)
	personas.POST(rutaMiFoto, middleware.RequirePermission("persona", permEditarMiPersona), fotoHandler.SubirMiFoto)

	configSvc := services.NewCarnetConfigService(db)
	carnetHandler := handlers.NewCarnetHandler(configSvc)
	configHandler := handlers.NewCarnetConfigHandler(configSvc)
	carnets := protected.Group("/carnets")
	carnets.GET("/configuracion", configHandler.Obtener)
	carnets.PUT("/configuracion", middleware.RequirePermission("carnet", permConfigurarCarnet), configHandler.Guardar)

	carnets.GET("/mi-carnet", middleware.RequirePermission("carnet", permVerCarnetDigital), carnetHandler.GetMiCarnet)
	carnets.POST("/solicitar", middleware.RequirePermission("carnet", permVerCarnetDigital), carnetHandler.SolicitarMiCarnet)
	carnets.GET(rutaMiFoto, middleware.RequirePermission("carnet", permVerCarnetDigital), carnetHandler.VerMiFotoCarnet)
	carnets.GET("/pendientes", middleware.RequirePermission("carnet", permValidarCarnetDigital), carnetHandler.ListarPendientes)
	carnets.GET("/biblioteca", middleware.RequirePermission("carnet", permVerCarnetBiblioteca), carnetHandler.ListarBiblioteca)
	carnets.GET("/biblioteca/excel", middleware.RequirePermission("carnet", permVerCarnetBiblioteca), carnetHandler.DescargarExcelBiblioteca)
	carnets.GET("/biblioteca/fotos/zip", middleware.RequirePermission("carnet", permVerCarnetBiblioteca), carnetHandler.DescargarFotosBibliotecaZip)
	carnets.GET("/biblioteca/:id/foto", middleware.RequirePermission("carnet", permVerCarnetBiblioteca), carnetHandler.VerFotoBiblioteca)
	carnets.GET("/:id", middleware.RequirePermission("carnet", permValidarCarnetDigital), carnetHandler.VerSolicitud)
	carnets.GET("/:id/foto", middleware.RequirePermission("carnet", permValidarCarnetDigital), carnetHandler.VerFotoSolicitud)
	carnets.POST("/:id/decidir", middleware.RequirePermission("carnet", permValidarCarnetDigital), carnetHandler.DecidirSolicitud)
}
