package router

import (
	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/handlers"
	"github.com/sena/cdattg-web-golang/middleware"
)

func SetupRouter() *gin.Engine {
	if gin.Mode() == "" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	// Middleware global
	r.Use(middleware.CORSMiddleware())

	// Handlers
	authHandler := handlers.NewAuthHandler()
	personaHandler := handlers.NewPersonaHandler()
	programaHandler := handlers.NewProgramaFormacionHandler()
		fichaHandler := handlers.NewFichaHandler()
		catalogoHandler := handlers.NewCatalogoHandler()
		aprendizHandler := handlers.NewAprendizHandler()
		instructorHandler := handlers.NewInstructorHandler()
		asistenciaHandler := handlers.NewAsistenciaHandler()
		adminHandler := handlers.NewAdminHandler()
		permisosHandler := handlers.NewPermisosHandler()
		_ = handlers.NewProductoHandler() // inventario desactivado
		_ = handlers.NewOrdenHandler()
		_ = handlers.NewAprobacionHandler()
		_ = handlers.NewDevolucionHandler()
		_ = handlers.NewInventarioDashboardHandler()
		_ = handlers.NewProveedorHandler()
		_ = handlers.NewCategoriaHandler()
		_ = handlers.NewMarcaHandler()
		_ = handlers.NewContratoConvenioHandler()

	// Rutas públicas
		api := r.Group("/api")
		{
			// WebSocket dashboard asistencia (token por query; solo superadmin; sin AuthMiddleware)
			api.GET("/asistencias/dashboard/ws", handlers.DashboardWebSocket)

			auth := api.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
			auth.GET("/me", middleware.AuthMiddleware(), authHandler.GetCurrentUser)
			auth.POST("/change-password", middleware.AuthMiddleware(), authHandler.ChangePassword)
		}

		// Rutas protegidas (auth + Casbin por permiso)
		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware())
		{
			personas := protected.Group("/personas")
			{
				personas.GET("", middleware.RequirePermission("persona", "VER PERSONAS"), personaHandler.GetAll)
				personas.GET("/import/template", middleware.RequirePermission("persona", "CREAR PERSONA"), personaHandler.DownloadPersonaImportTemplate)
				personas.GET("/imports", middleware.RequirePermission("persona", "VER PERSONAS"), personaHandler.ListPersonaImports)
				personas.POST("/import", middleware.RequirePermission("persona", "CREAR PERSONA"), personaHandler.ImportPersonas)
				personas.GET("/:id", middleware.RequirePermission("persona", "VER PERSONA"), personaHandler.GetByID)
				personas.POST("", middleware.RequirePermission("persona", "CREAR PERSONA"), personaHandler.Create)
				personas.PUT("/:id", middleware.RequirePermission("persona", "EDITAR PERSONA"), personaHandler.Update)
				personas.DELETE("/:id", middleware.RequirePermission("persona", "ELIMINAR PERSONA"), personaHandler.Delete)
				personas.POST("/:id/reset-password", middleware.RequirePermission("persona", "EDITAR PERSONA"), personaHandler.ResetPassword)
			}

			programas := protected.Group("/programas-formacion")
			{
				programas.GET("", middleware.RequirePermission("programa", "VER PROGRAMAS"), programaHandler.GetAll)
				programas.POST("/import", middleware.RequirePermission("programa", "CREAR PROGRAMA"), programaHandler.ImportProgramas)
				programas.GET("/:id", middleware.RequirePermission("programa", "VER PROGRAMA"), programaHandler.GetByID)
				programas.POST("", middleware.RequirePermission("programa", "CREAR PROGRAMA"), programaHandler.Create)
				programas.PUT("/:id", middleware.RequirePermission("programa", "EDITAR PROGRAMA"), programaHandler.Update)
				programas.DELETE("/:id", middleware.RequirePermission("programa", "ELIMINAR PROGRAMA"), programaHandler.Delete)
			}

			catalogos := protected.Group("/catalogos")
			catalogos.Use(middleware.RequirePermission("ficha", "VER FICHAS"))
			{
				catalogos.GET("/sedes", catalogoHandler.GetSedes)
				catalogos.GET("/ambientes", catalogoHandler.GetAmbientes)
				catalogos.GET("/modalidades-formacion", catalogoHandler.GetModalidadesFormacion)
				catalogos.GET("/jornadas", catalogoHandler.GetJornadas)
				catalogos.GET("/dias-formacion", catalogoHandler.GetDiasFormacion)
			}
			catalogosPersona := protected.Group("/catalogos")
			catalogosPersona.Use(middleware.RequirePermission("persona", "VER PERSONAS"))
			{
				catalogosPersona.GET("/paises", catalogoHandler.GetPaises)
				catalogosPersona.GET("/departamentos", catalogoHandler.GetDepartamentos)
				catalogosPersona.GET("/municipios", catalogoHandler.GetMunicipios)
				catalogosPersona.GET("/tipos-documento", catalogoHandler.GetTiposDocumento)
				catalogosPersona.GET("/generos", catalogoHandler.GetGeneros)
				catalogosPersona.GET("/persona-caracterizacion", catalogoHandler.GetPersonaCaracterizacion)
				catalogosPersona.GET("/regionales", catalogoHandler.GetRegionales)
			}

			fichas := protected.Group("/fichas-caracterizacion")
			{
				fichas.GET("", middleware.RequirePermissionFichasOrMisFichas(), fichaHandler.GetAll)
				fichas.GET("/:id/detalle", middleware.RequirePermission("ficha", "VER FICHA"), fichaHandler.GetByIDWithDetail)
				fichas.GET("/:id", middleware.RequirePermission("ficha", "VER FICHA"), fichaHandler.GetByID)
				fichas.POST("/import", middleware.RequirePermission("ficha", "CREAR FICHA"), fichaHandler.ImportFichas)
				fichas.POST("", middleware.RequirePermission("ficha", "CREAR FICHA"), fichaHandler.Create)
				fichas.PUT("/:id", middleware.RequirePermission("ficha", "EDITAR FICHA"), fichaHandler.Update)
				fichas.DELETE("/:id", middleware.RequirePermission("ficha", "ELIMINAR FICHA"), fichaHandler.Delete)
				fichas.GET("/:id/instructores", middleware.RequirePermissionListInstructoresFicha(), fichaHandler.ListInstructores)
				fichas.POST("/:id/instructores", middleware.RequirePermission("ficha", "GESTIONAR INSTRUCTORES FICHA"), fichaHandler.AsignarInstructores)
				fichas.DELETE("/:id/instructores/:instructorId", middleware.RequirePermission("ficha", "GESTIONAR INSTRUCTORES FICHA"), fichaHandler.DesasignarInstructor)
				fichas.GET("/:id/aprendices", middleware.RequirePermissionListAprendicesFicha(), fichaHandler.ListAprendices)
				fichas.POST("/:id/aprendices", middleware.RequirePermission("ficha", "GESTIONAR APRENDICES FICHA"), fichaHandler.AsignarAprendices)
				fichas.POST("/:id/aprendices/desasignar", middleware.RequirePermission("ficha", "GESTIONAR APRENDICES FICHA"), fichaHandler.DesasignarAprendices)
			}

			instructores := protected.Group("/instructores")
			instructores.GET("", middleware.RequirePermission("ficha", "VER FICHAS"), instructorHandler.GetAll)
			instructores.GET("/imports", middleware.RequirePermission("instructor", "CREAR INSTRUCTOR"), instructorHandler.ListInstructorImports)
			instructores.POST("/import", middleware.RequirePermission("instructor", "CREAR INSTRUCTOR"), instructorHandler.ImportInstructores)
			instructores.GET("/:id", middleware.RequirePermission("ficha", "VER FICHAS"), instructorHandler.GetByID)
			instructores.POST("", middleware.RequirePermission("instructor", "CREAR INSTRUCTOR"), instructorHandler.CreateFromPersona)
			instructores.PUT("/:id", middleware.RequirePermission("instructor", "EDITAR INSTRUCTOR"), instructorHandler.Update)
			instructores.DELETE("/:id", middleware.RequirePermission("instructor", "ELIMINAR INSTRUCTOR"), instructorHandler.Delete)

			asistencias := protected.Group("/asistencias")
			asistencias.GET("/dashboard", middleware.RequireSuperAdmin(), asistenciaHandler.GetDashboard)
			// Entrar a tomar asistencia: solo requiere estar autenticado; el servicio valida que el usuario sea instructor asignado a la ficha.
			asistencias.POST("/entrar-tomar-asistencia", asistenciaHandler.EntrarTomarAsistencia)
			asistencias.POST("", middleware.RequirePermission("asistencia", "TOMAR ASISTENCIA"), asistenciaHandler.CreateSesion)
			asistencias.GET("/instructor-ficha/:instructorFichaId", middleware.RequirePermission("asistencia", "VER ASISTENCIA"), asistenciaHandler.ListByInstructorFicha)
			asistencias.GET("/ficha/:fichaId", middleware.RequirePermission("asistencia", "VER ASISTENCIA"), asistenciaHandler.ListByFichaAndFechas)
			// Pendientes de revisión:
			// ya se valida dentro del handler que el usuario autenticado
			// esté vinculado como instructor. No se requiere permiso Casbin adicional.
			asistencias.GET("/pendientes-revision", asistenciaHandler.ListPendientesRevision)
			asistencias.POST("/ingreso", middleware.RequirePermission("asistencia", "TOMAR ASISTENCIA"), asistenciaHandler.RegistrarIngreso)
			asistencias.POST("/ingreso-por-documento", middleware.RequirePermission("asistencia", "TOMAR ASISTENCIA"), asistenciaHandler.RegistrarIngresoPorDocumento)
			asistencias.PUT("/aprendiz/:asistenciaAprendizId/salida", middleware.RequirePermission("asistencia", "TOMAR ASISTENCIA"), asistenciaHandler.RegistrarSalida)
			asistencias.PUT("/aprendiz/:asistenciaAprendizId/observaciones", middleware.RequirePermission("asistencia", "TOMAR ASISTENCIA"), asistenciaHandler.ActualizarObservaciones)
			asistencias.PUT("/aprendiz/:asistenciaAprendizId/estado", middleware.RequirePermission("asistencia", "TOMAR ASISTENCIA"), asistenciaHandler.AjustarEstadoAprendiz)
			asistencias.GET("/:id/aprendices", middleware.RequirePermission("asistencia", "VER ASISTENCIA"), asistenciaHandler.ListAprendicesEnSesion)
			asistencias.PUT("/:id/aprendiz/:aprendizId/observaciones", middleware.RequirePermission("asistencia", "TOMAR ASISTENCIA"), asistenciaHandler.CrearOActualizarObservaciones)
			asistencias.PUT("/:id/finalizar", middleware.RequirePermission("asistencia", "TOMAR ASISTENCIA"), asistenciaHandler.Finalizar)
			asistencias.GET("/:id", middleware.RequirePermission("asistencia", "VER ASISTENCIA"), asistenciaHandler.GetByID)

			admin := protected.Group("/admin")
			admin.POST("/sync-instructor-roles", middleware.RequirePermission("ficha", "VER FICHAS"), adminHandler.SyncInstructorRoles)
			// sync-inventario-permissions desactivado (módulo inventario no en uso)

			// Gestión de permisos y roles (ASIGNAR PERMISOS o SUPER ADMIN para roles)
			permisos := protected.Group("/permisos")
			permisos.Use(middleware.RequirePermission("usuario", "ASIGNAR PERMISOS"))
			{
				permisos.GET("/definiciones", permisosHandler.Definiciones)
			}
			usuarios := protected.Group("/usuarios")
			usuarios.Use(middleware.RequirePermission("usuario", "ASIGNAR PERMISOS"))
			{
				usuarios.GET("", permisosHandler.ListUsuarios)
				usuarios.GET("/:id/permisos", permisosHandler.GetPermisos)
				usuarios.POST("/:id/permisos", permisosHandler.AsignarPermiso)
				usuarios.DELETE("/:id/permisos/:obj/:act", permisosHandler.QuitarPermiso)
				usuarios.PATCH("/:id/estado", permisosHandler.ToggleEstado)
			}
			usuariosRoles := protected.Group("/usuarios")
			usuariosRoles.Use(middleware.RequireSuperAdmin())
			{
				usuariosRoles.PATCH("/:id/roles", permisosHandler.SetRoles)
			}

			// Inventario desactivado: rutas /inventario, /productos, /ordenes, /aprobaciones, /devoluciones, /proveedores, /categorias, /marcas, /contratos-convenios no registradas

			aprendices := protected.Group("/aprendices")
			{
				aprendices.GET("", middleware.RequirePermission("aprendiz", "VER APRENDICES"), aprendizHandler.GetAll)
				aprendices.GET("/:id", middleware.RequirePermission("aprendiz", "VER APRENDIZ"), aprendizHandler.GetByID)
				aprendices.POST("", middleware.RequirePermission("aprendiz", "CREAR APRENDIZ"), aprendizHandler.Create)
				aprendices.PUT("/:id", middleware.RequirePermission("aprendiz", "EDITAR APRENDIZ"), aprendizHandler.Update)
				aprendices.DELETE("/:id", middleware.RequirePermission("aprendiz", "ELIMINAR APRENDIZ"), aprendizHandler.Delete)
			}
		}
	}

	return r
}
