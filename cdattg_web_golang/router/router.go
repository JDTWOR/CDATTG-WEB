package router

import (
	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/handlers"
	"github.com/sena/cdattg-web-golang/middleware"
)

// Literales Casbin y segmentos de ruta reutilizados (Sonar: evitar duplicación).
const (
	routeImport       = "/import"
	routeIDAprendices = "/:id/aprendices"

	routeSedes      = "/sedes"
	routeAmbientes  = "/ambientes"
	routeBloques    = "/bloques"
	routePisos      = "/pisos"

	permVerPersonas     = "VER PERSONAS"
	permCrearPersona    = "CREAR PERSONA"
	permVerFichas       = "VER FICHAS"
	permCrearInstructor = "CREAR INSTRUCTOR"
	permTomarAsistencia = "TOMAR ASISTENCIA"
	permVerAsistencia          = "VER ASISTENCIA"
	permProgramarInstructores  = "PROGRAMAR INSTRUCTORES"
	permGestionarAprendicesFicha = "GESTIONAR APRENDICES FICHA"
	permVerMiAgenda            = "VER MI AGENDA"
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
	agendaHandler := handlers.NewInstructorAgendaHandler()
	catalogoHandler := handlers.NewCatalogoHandler()
	aprendizHandler := handlers.NewAprendizHandler()
	instructorHandler := handlers.NewInstructorHandler()
	asistenciaHandler := handlers.NewAsistenciaHandler()
	handlers.StartAsistenciaAutoFinalize(asistenciaHandler)
	adminHandler := handlers.NewAdminHandler()
	permisosHandler := handlers.NewPermisosHandler()
	ambienteHandler := handlers.NewAmbienteHandler()
	sedeInfraHandler := handlers.NewSedeHandler()
	pisoInfraHandler := handlers.NewPisoHandler()
	bloqueInfraHandler := handlers.NewBloqueHandler()
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
				personas.GET("", middleware.RequirePermission("persona", permVerPersonas), personaHandler.GetAll)
				personas.GET("/import/template", middleware.RequirePermission("persona", permCrearPersona), personaHandler.DownloadPersonaImportTemplate)
				personas.GET("/imports", middleware.RequirePermission("persona", permVerPersonas), personaHandler.ListPersonaImports)
				personas.POST(routeImport, middleware.RequirePermission("persona", permCrearPersona), personaHandler.ImportPersonas)
				personas.GET("/:id", middleware.RequirePermission("persona", "VER PERSONA"), personaHandler.GetByID)
				personas.POST("", middleware.RequirePermission("persona", permCrearPersona), personaHandler.Create)
				personas.PUT("/:id", middleware.RequirePermission("persona", "EDITAR PERSONA"), personaHandler.Update)
				personas.DELETE("/:id", middleware.RequirePermission("persona", "ELIMINAR PERSONA"), personaHandler.Delete)
				personas.POST("/:id/reset-password", middleware.RequirePermission("persona", "EDITAR PERSONA"), personaHandler.ResetPassword)
			}

			programas := protected.Group("/programas-formacion")
			{
				programas.GET("", middleware.RequirePermission("programa", "VER PROGRAMAS"), programaHandler.GetAll)
				programas.POST(routeImport, middleware.RequirePermission("programa", "CREAR PROGRAMA"), programaHandler.ImportProgramas)
				programas.GET("/:id", middleware.RequirePermission("programa", "VER PROGRAMA"), programaHandler.GetByID)
				programas.POST("", middleware.RequirePermission("programa", "CREAR PROGRAMA"), programaHandler.Create)
				programas.PUT("/:id", middleware.RequirePermission("programa", "EDITAR PROGRAMA"), programaHandler.Update)
				programas.DELETE("/:id", middleware.RequirePermission("programa", "ELIMINAR PROGRAMA"), programaHandler.Delete)
			}

			catalogos := protected.Group("/catalogos")
			catalogos.Use(middleware.RequirePermissionCatalogosFicha())
			{
				catalogos.GET(routeSedes, catalogoHandler.GetSedes)
				catalogos.GET(routeAmbientes, catalogoHandler.GetAmbientes)
				catalogos.GET("/modalidades-formacion", catalogoHandler.GetModalidadesFormacion)
				catalogos.GET("/jornadas", catalogoHandler.GetJornadas)
				catalogos.GET("/dias-formacion", catalogoHandler.GetDiasFormacion)
			}
			catalogosPersona := protected.Group("/catalogos")
			catalogosPersona.Use(middleware.RequirePermission("persona", permVerPersonas))
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
				fichas.GET("/:id/detalle", middleware.RequirePermissionLeerFichaIndividual(), fichaHandler.GetByIDWithDetail)
				fichas.GET("/:id/codigo", middleware.RequirePermissionVerFichaOrInstructorDeFicha(), fichaHandler.GetCodigo)
				fichas.GET("/:id", middleware.RequirePermissionLeerFichaIndividual(), fichaHandler.GetByID)
				fichas.POST(routeImport, middleware.RequirePermission("ficha", "CREAR FICHA"), fichaHandler.ImportFichas)
				fichas.GET("/export/all", middleware.RequirePermission("ficha", permVerFichas), fichaHandler.ExportAllExcel)
				fichas.POST("", middleware.RequirePermission("ficha", "CREAR FICHA"), fichaHandler.Create)
				fichas.PUT("/:id", middleware.RequirePermission("ficha", "EDITAR FICHA"), fichaHandler.Update)
				fichas.DELETE("/:id", middleware.RequirePermission("ficha", "ELIMINAR FICHA"), fichaHandler.Delete)
				fichas.GET("/:id/instructores", middleware.RequirePermissionListInstructoresFicha(), fichaHandler.ListInstructores)
				fichas.GET("/:id/agenda", middleware.RequirePermission("ficha", permProgramarInstructores), agendaHandler.GetAgendaFicha)
				fichas.POST("/:id/instructores", middleware.RequirePermission("ficha", permProgramarInstructores), fichaHandler.AsignarInstructores)
				fichas.DELETE("/:id/instructores/:instructorId", middleware.RequirePermission("ficha", permProgramarInstructores), fichaHandler.DesasignarInstructor)
				fichas.GET(routeIDAprendices, middleware.RequirePermissionListAprendicesFicha(), fichaHandler.ListAprendices)
				fichas.POST(routeIDAprendices, middleware.RequirePermission("ficha", permGestionarAprendicesFicha), fichaHandler.AsignarAprendices)
				fichas.POST(routeIDAprendices+"/desasignar", middleware.RequirePermission("ficha", permGestionarAprendicesFicha), fichaHandler.DesasignarAprendices)
				fichas.POST(routeIDAprendices+"/ocultar-asistencia", middleware.RequirePermission("ficha", permGestionarAprendicesFicha), fichaHandler.OcultarAprendicesEnAsistencia)
			}

			instructores := protected.Group("/instructores")
			instructores.GET("", middleware.RequirePermission("ficha", permVerFichas), instructorHandler.GetAll)
			instructores.GET("/agenda", middleware.RequirePermission("asistencia", permVerMiAgenda), agendaHandler.GetMiAgenda)

			instructorSelf := protected.Group("/instructor")
			instructorSelf.GET("/agenda", middleware.RequirePermission("asistencia", permVerMiAgenda), agendaHandler.GetMiAgenda)
			instructores.GET("/imports", middleware.RequirePermission("instructor", permCrearInstructor), instructorHandler.ListInstructorImports)
			instructores.POST(routeImport, middleware.RequirePermission("instructor", permCrearInstructor), instructorHandler.ImportInstructores)
			instructores.GET("/:id", middleware.RequirePermission("ficha", permVerFichas), instructorHandler.GetByID)
			instructores.POST("", middleware.RequirePermission("instructor", permCrearInstructor), instructorHandler.CreateFromPersona)
			instructores.PUT("/:id", middleware.RequirePermission("instructor", "EDITAR INSTRUCTOR"), instructorHandler.Update)
			instructores.DELETE("/:id", middleware.RequirePermission("instructor", "ELIMINAR INSTRUCTOR"), instructorHandler.Delete)

			asistencias := protected.Group("/asistencias")
			// Dashboard de asistencia y Casos de Bienestar: accesible para SUPER ADMINISTRADOR y BIENESTAR AL APRENDIZ
			asistencias.GET("/dashboard", middleware.RequireSuperAdminOrBienestar(), asistenciaHandler.GetDashboard)
			asistencias.GET("/dashboard/casos-bienestar", middleware.RequireSuperAdminOrBienestar(), asistenciaHandler.GetCasosBienestar)
			asistencias.GET("/dashboard/casos-bienestar/ficha/:fichaNumero/aprendiz/:aprendizId/detalle", middleware.RequireSuperAdminOrBienestar(), asistenciaHandler.GetDetalleInasistenciasAprendiz)
			asistencias.GET("/dashboard/pendientes-revision-instructor", middleware.RequireSuperAdminOrBienestar(), asistenciaHandler.ListPendientesRevisionAdmin)
			// Entrar a tomar asistencia: solo requiere estar autenticado; el servicio valida que el usuario sea instructor asignado a la ficha.
			asistencias.POST("/entrar-tomar-asistencia", asistenciaHandler.EntrarTomarAsistencia)
			asistencias.POST("", middleware.RequirePermission("asistencia", permTomarAsistencia), asistenciaHandler.CreateSesion)
			asistencias.GET("/instructor-ficha/:instructorFichaId", middleware.RequirePermission("asistencia", permVerAsistencia), asistenciaHandler.ListByInstructorFicha)
			asistencias.GET("/ficha/:fichaId", middleware.RequirePermissionListAsistenciasPorFicha(), asistenciaHandler.ListByFichaAndFechas)
			// Pendientes de revisión:
			// ya se valida dentro del handler que el usuario autenticado
			// esté vinculado como instructor. No se requiere permiso Casbin adicional.
			asistencias.GET("/pendientes-revision", asistenciaHandler.ListPendientesRevision)
			asistencias.POST("/ingreso", middleware.RequirePermission("asistencia", permTomarAsistencia), asistenciaHandler.RegistrarIngreso)
			asistencias.POST("/ingreso-por-documento", middleware.RequirePermission("asistencia", permTomarAsistencia), asistenciaHandler.RegistrarIngresoPorDocumento)
			asistencias.PUT("/:id/observaciones-sesion", middleware.RequirePermission("asistencia", permTomarAsistencia), asistenciaHandler.ActualizarObservacionesSesion)
			asistencias.PUT("/aprendiz/:asistenciaAprendizId/salida", middleware.RequirePermission("asistencia", permTomarAsistencia), asistenciaHandler.RegistrarSalida)
			asistencias.PUT("/aprendiz/:asistenciaAprendizId/observaciones", middleware.RequirePermission("asistencia", permTomarAsistencia), asistenciaHandler.ActualizarObservaciones)
			asistencias.PUT("/aprendiz/:asistenciaAprendizId/estado", middleware.RequirePermission("asistencia", permTomarAsistencia), asistenciaHandler.AjustarEstadoAprendiz)
			// Catálogo de tipos de observación: solo requiere estar autenticado (no hay id de sesión para fallback de instructor)
			asistencias.GET("/tipos-observacion", asistenciaHandler.ListTiposObservacionAsistencia)
			asistencias.POST("/tipos-observacion", middleware.RequireSuperAdminOrAdmin(), asistenciaHandler.CrearTipoObservacionAsistencia)
			asistencias.PUT("/tipos-observacion/:id", middleware.RequireSuperAdminOrAdmin(), asistenciaHandler.ActualizarTipoObservacionAsistencia)
			asistencias.DELETE("/tipos-observacion/:id", middleware.RequireSuperAdminOrAdmin(), asistenciaHandler.EliminarTipoObservacionAsistencia)
			asistencias.GET(routeIDAprendices, middleware.RequirePermission("asistencia", permVerAsistencia), asistenciaHandler.ListAprendicesEnSesion)
			asistencias.PUT("/:id/aprendiz/:aprendizId/observaciones", middleware.RequirePermission("asistencia", permTomarAsistencia), asistenciaHandler.CrearOActualizarObservaciones)
			asistencias.GET("/:id", middleware.RequirePermission("asistencia", permVerAsistencia), asistenciaHandler.GetByID)

			admin := protected.Group("/admin")
			admin.POST("/sync-instructor-roles", middleware.RequirePermission("ficha", permVerFichas), adminHandler.SyncInstructorRoles)
			admin.POST("/sync-agenda-permissions", middleware.RequireSuperAdminOrAdmin(), adminHandler.SyncAgendaPermissions)
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

			// Infraestructura: CRUD de sedes, bloques, pisos y ambientes (sólo SUPER ADMINISTRADOR)
			infraestructura := protected.Group("/infraestructura")
			infraestructura.Use(middleware.RequireSuperAdmin())
			{
				infraestructura.GET(routeSedes, sedeInfraHandler.List)
				infraestructura.POST(routeSedes, sedeInfraHandler.Create)
				infraestructura.PUT(routeSedes+"/:id", sedeInfraHandler.Update)
				infraestructura.DELETE(routeSedes+"/:id", sedeInfraHandler.Delete)

				infraestructura.GET(routeBloques, bloqueInfraHandler.List)
				infraestructura.POST(routeBloques, bloqueInfraHandler.Create)
				infraestructura.PUT(routeBloques+"/:id", bloqueInfraHandler.Update)
				infraestructura.DELETE(routeBloques+"/:id", bloqueInfraHandler.Delete)

				infraestructura.GET(routePisos, pisoInfraHandler.List)
				infraestructura.POST(routePisos, pisoInfraHandler.Create)
				infraestructura.PUT(routePisos+"/:id", pisoInfraHandler.Update)
				infraestructura.DELETE(routePisos+"/:id", pisoInfraHandler.Delete)

				infraestructura.GET(routeAmbientes, ambienteHandler.List)
				infraestructura.POST(routeAmbientes, ambienteHandler.Create)
				infraestructura.PUT(routeAmbientes+"/:id", ambienteHandler.Update)
				infraestructura.DELETE(routeAmbientes+"/:id", ambienteHandler.Delete)
			}
		}
	}

	return r
}
