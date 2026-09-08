/**
 * Registro las rutas del submódulo de pérdida de carnet. El comprobante valida
 * dentro del handler porque puede consultarlo el dueño (aprendiz) o quien
 * valida (bibliotecario/super).
 *
 * @author Cristian Deysdayr Jiménez
 */
package router

import (
	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/handlers"
	"github.com/sena/cdattg-web-golang/middleware"
)

const (
	permSolicitarCarnetPerdida = "SOLICITAR CARNET PERDIDA"
	permValidarCarnetPerdida   = "VALIDAR CARNET PERDIDA"
)

func registerCarnetPerdida(protected *gin.RouterGroup) {
	h := handlers.NewCarnetPerdidaHandler()
	g := protected.Group("/carnets/perdida")
	g.POST("", middleware.RequirePermission("carnet", permSolicitarCarnetPerdida), h.Crear)
	g.GET("/mi-historial", middleware.RequirePermission("carnet", permSolicitarCarnetPerdida), h.MiHistorial)
	g.GET("/revisiones", middleware.RequirePermission("carnet", permValidarCarnetPerdida), h.Revisiones)
	g.POST("/:id/decidir", middleware.RequirePermission("carnet", permValidarCarnetPerdida), h.Decidir)
	g.POST("/:id/renovar", middleware.RequirePermission("carnet", permValidarCarnetPerdida), h.Renovar)
	g.POST("/:id/notificar-disponible", middleware.RequirePermission("carnet", permValidarCarnetPerdida), h.NotificarDisponible)
	// Sin RequirePermission: el handler permite dueño o validador.
	g.GET("/:id/comprobante", h.Comprobante)
	g.GET("/:id/comprobantes/zip", h.ComprobantesZip)
	g.GET("/:id/foto", h.VerFoto)
	g.GET("/:id/foto/zip", h.FotoZip)
}
