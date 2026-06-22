package router

import (
	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/handlers"
	"github.com/sena/cdattg-web-golang/middleware"
)

const (
	objEleccion               = "eleccion"
	permGestionarEleccion     = "GESTIONAR ELECCION"
	permVerEleccion           = "VER ELECCION"
	permVotarEleccion         = "VOTAR ELECCION"
	permVerResultadosEleccion = "VER RESULTADOS ELECCION"
)

func registerEleccionRoutes(group *gin.RouterGroup, h *handlers.EleccionHandler) {
	group.GET("/reglas", h.GetReglas)
	group.GET("/mi-regional", middleware.RequirePermission(objEleccion, permVerEleccion), h.GetMiRegional)
	group.GET("/regionales/:id/representantes-vigentes", middleware.RequirePermission(objEleccion, permVerEleccion), h.GetRepresentantesVigentes)

	aprendiz := group.Group("")
	aprendiz.Use(middleware.RequirePermission(objEleccion, permVotarEleccion))
	{
		aprendiz.POST("/procesos/:id/planchas", h.ProponerPlancha)
		aprendiz.POST("/planchas/:id/confirmar", h.ConfirmarPlancha)
		aprendiz.POST("/planchas/:id/retirar", h.RetirarPlancha)
		aprendiz.POST("/procesos/:id/voto", h.RegistrarVoto)
		aprendiz.GET("/procesos/:id/planchas", h.ListPlanchasAprendiz)
	}

	admin := group.Group("")
	admin.Use(middleware.RequireSuperAdminAdminOrCoordinator())
	registerEleccionAdminRoutes(admin, h)
}

func registerEleccionAdminRoutes(admin *gin.RouterGroup, h *handlers.EleccionHandler) {
	gestionar := middleware.RequirePermission(objEleccion, permGestionarEleccion)
	resultados := middleware.RequirePermission(objEleccion, permVerResultadosEleccion)

	admin.GET("/procesos", gestionar, h.ListProcesos)
	admin.POST("/procesos", gestionar, h.CreateProceso)
	admin.GET("/procesos/:id", gestionar, h.GetProceso)
	admin.PUT("/procesos/:id", gestionar, h.UpdateProceso)
	admin.POST("/procesos/:id/abrir-inscripcion", gestionar, h.AbrirInscripcion)
	admin.POST("/procesos/:id/cerrar-inscripcion", gestionar, h.CerrarInscripcion)
	admin.POST("/procesos/:id/abrir-votacion", gestionar, h.AbrirVotacion)
	admin.POST("/procesos/:id/calcular-resultado", gestionar, h.CalcularResultado)
	admin.POST("/procesos/:id/registrar-desempate", gestionar, h.RegistrarDesempate)
	admin.GET("/procesos/:id/planchas-admin", gestionar, h.ListPlanchasAdmin)
	admin.POST("/planchas/:id/rechazar", gestionar, h.RechazarPlancha)
	admin.GET("/procesos/:id/resultados", resultados, h.GetResultados)
	admin.GET("/procesos/:id/resultados/export", resultados, h.ExportResultadosCSV)
	admin.GET("/regionales/:id/historial-representantes", resultados, h.GetHistorialRepresentantes)
}
