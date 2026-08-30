/**
 * router: rutas públicas y admin del portal / semillero / registro.
 * @author Cristian Deysdayr Jiménez
 */
package router

import (
	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/authz"
	"github.com/sena/cdattg-web-golang/handlers"
	"github.com/sena/cdattg-web-golang/middleware"
)

// registerPortalRoutes monta registro, API pública y CRUD autenticado.
func registerPortalRoutes(api *gin.RouterGroup, protected *gin.RouterGroup, catalogo *handlers.CatalogoHandler) {
	reg := handlers.NewRegisterHandler()
	api.POST("/auth/register", reg.Register)

	pub := api.Group("/public")
	portalPub := handlers.NewPortalPublicHandler()
	pub.GET("/portal", portalPub.Home)
	pub.GET("/portal/archivos/*nombre", portalPub.Archivo)
	pub.HEAD("/portal/archivos/*nombre", portalPub.Archivo)
	pub.GET("/semilleros", portalPub.Semilleros)
	pub.GET("/semilleros/:slug", portalPub.Semillero)
	invPub := handlers.NewBiogjgasPublicHandler()
	pub.GET("/investigacion", invPub.Home)
	pub.GET("/investigacion/presentacion", invPub.Presentacion)
	pub.GET("/investigacion/:kind", invPub.Listar)
	pub.GET("/investigacion/:kind/:id", invPub.Detalle)
	cats := pub.Group("/catalogos")
	{
		cats.GET("/paises", catalogo.GetPaises)
		cats.GET("/departamentos", catalogo.GetDepartamentos)
		cats.GET("/municipios", catalogo.GetMunicipios)
		cats.GET("/tipos-documento", catalogo.GetTiposDocumento)
		cats.GET("/generos", catalogo.GetGeneros)
		cats.GET("/persona-caracterizacion", catalogo.GetPersonaCaracterizacion)
	}

	perm := middleware.RequirePermission(authz.ObjSemillero, authz.ActGestionarSemillero)
	adminPortal := handlers.NewPortalAdminHandler()
	adminSem := handlers.NewSemilleroAdminHandler()
	portal := protected.Group("/portal")
	portal.Use(perm)
	{
		portal.GET("/banners", adminPortal.ListBanners)
		portal.POST("/banners", adminPortal.CreateBanner)
		portal.PUT("/banners/:id", adminPortal.UpdateBanner)
		portal.DELETE("/banners/:id", adminPortal.DeleteBanner)
		portal.GET("/presentacion", adminPortal.GetPresentacion)
		portal.PUT("/presentacion", adminPortal.PutPresentacion)
		portal.POST("/archivos", adminPortal.SubirArchivo)
	}
	sem := protected.Group("/semilleros")
	sem.Use(perm)
	{
		sem.GET("", adminSem.List)
		sem.POST("", adminSem.Create)
		sem.GET("/:id", adminSem.Get)
		sem.PUT("/:id", adminSem.Update)
		sem.DELETE("/:id", adminSem.Delete)
	}
	const rutaKindID = "/:kind/:id"
	edit := handlers.NewBiogjgasEditorialHandler()
	inv := protected.Group("/investigacion")
	inv.Use(perm)
	{
		inv.GET("/:kind", edit.List)
		inv.POST("/:kind", edit.Create)
		inv.GET(rutaKindID, edit.Get)
		inv.PUT(rutaKindID, edit.Update)
		inv.DELETE(rutaKindID, edit.Delete)
	}
}
