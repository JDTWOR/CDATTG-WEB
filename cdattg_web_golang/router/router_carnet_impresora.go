/**
 * Registro las rutas de la impresora de carnets.
 * Van fuera del login de personas: solo la clave de máquina.
 *
 * @author Cristian Deysdayr Jiménez
 */
package router

import (
	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/handlers"
	"github.com/sena/cdattg-web-golang/middleware"
)

func registerCarnetImpresora(api *gin.RouterGroup) {
	h := handlers.NewCarnetHandler()
	g := api.Group("/impresora/carnets")
	g.Use(middleware.RequireClaveImpresora())
	g.GET("", h.ListarBiblioteca)
	g.GET("/excel", h.DescargarExcelBiblioteca)
	g.GET("/foto", h.VerFotoImpresora)
}
