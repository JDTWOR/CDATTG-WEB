/**
 * Registro las rutas de la campana y el buzón de notificaciones.
 *
 * @author Cristian Deysdayr Jiménez
 */
package router

import (
	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/handlers"
)

func registerNotificaciones(protected *gin.RouterGroup) {
	h := handlers.NewNotificacionHandler()
	g := protected.Group("/notificaciones")
	g.GET("", h.Listar)
	g.GET("/no-leidas", h.ContarNoLeidas)
	g.PUT("/:id/leida", h.MarcarLeida)
	g.DELETE("", h.EliminarTodas)
	g.DELETE("/:id", h.Eliminar)
}
