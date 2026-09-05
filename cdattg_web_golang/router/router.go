package router

import (
	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/handlers"
	"github.com/sena/cdattg-web-golang/middleware"
)

// Literales Casbin y segmentos de ruta reutilizados (Sonar: evitar duplicación).
const (
	routeUsuarios         = "/usuarios"
	routeImport         = "/import"
	routeImportTemplate = "/import/template"
	routeImports        = "/imports"
	routeIDAprendices   = "/:id/aprendices"
	objPersOpApoyo      = "personal-operativo-apoyo"
	objPersAdmin        = "personal-administrativo"

	routeSedes      = "/sedes"
	routeAmbientes  = "/ambientes"
	routeBloques    = "/bloques"
	routePisos      = "/pisos"
	routeJornadas   = "/jornadas"
	routeDiasSinFormacion = "/dias-sin-formacion"
	routeDiasSinFormacionFicha = "/dias-sin-formacion-ficha"
	routeConfiguracionAsistencia = "/configuracion-asistencia"

	permVerPersonas     = "VER PERSONAS"
	permCrearPersona    = "CREAR PERSONA"
	permEditarMiPersona = "EDITAR MI PERSONA"
	permVerFichas       = "VER FICHAS"
	permCrearFicha      = "CREAR FICHA"
	permCrearInstructor = "CREAR INSTRUCTOR"
	permTomarAsistencia = "TOMAR ASISTENCIA"
	permVerAsistencia          = "VER ASISTENCIA"
	permVerMisInasistencias    = "VER MIS INASISTENCIAS"
	permProgramarInstructores  = "PROGRAMAR INSTRUCTORES"
	permGestionarAprendicesFicha = "GESTIONAR APRENDICES FICHA"
	permVerPersonalOperativoYDeApoyo = "VER PERSONAL OPERATIVO Y DE APOYO"
	permCrearPersonalOperativoYDeApoyo = "CREAR PERSONAL OPERATIVO Y DE APOYO"
	permEditarPersonalOperativoYDeApoyo = "EDITAR PERSONAL OPERATIVO Y DE APOYO"
	permEliminarPersonalOperativoYDeApoyo = "ELIMINAR PERSONAL OPERATIVO Y DE APOYO"
	permVerContratista         = "VER CONTRATISTAS PRESTACIÓN DE SERVICIOS"
	permCrearContratista       = "CREAR CONTRATISTAS PRESTACIÓN DE SERVICIOS"
	permEditarContratista      = "EDITAR CONTRATISTAS PRESTACIÓN DE SERVICIOS"
	permEliminarContratista    = "ELIMINAR CONTRATISTAS PRESTACIÓN DE SERVICIOS"
	permVerPersonalAdministrativo = "VER PERSONAL ADMINISTRATIVO"
	permCrearPersonalAdministrativo = "CREAR PERSONAL ADMINISTRATIVO"
	permEditarPersonalAdministrativo = "EDITAR PERSONAL ADMINISTRATIVO"
	permEliminarPersonalAdministrativo = "ELIMINAR PERSONAL ADMINISTRATIVO"
	permVerMiAgenda            = "VER MI AGENDA"
	permRegistrarAccesoSede    = "REGISTRAR ACCESO SEDE"
	permVerAccesoSede          = "VER ACCESO SEDE"
	permRegistrarPersona       = "REGISTRAR PERSONA"
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
	personalOperativoApoyoHandler := handlers.NewPersonalOperativoApoyoHandler()
	personalAdministrativoHandler := handlers.NewPersonalAdministrativoHandler()
	contratistaHandler := handlers.NewContratistaHandler()
	asistenciaHandler := handlers.NewAsistenciaHandler()
	handlers.StartAsistenciaAutoFinalize(asistenciaHandler)
	adminHandler := handlers.NewAdminHandler()
	permisosHandler := handlers.NewPermisosHandler()
	statsHandler := handlers.NewStatsHandler()
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
	jornadaHandler := handlers.NewJornadaHandler()
	diaSinFormacionHandler := handlers.NewDiaSinFormacionSedeHandler()
	diaSinFormacionFichaHandler := handlers.NewDiaSinFormacionFichaHandler()
	configAsistenciaHandler := handlers.NewConfiguracionAsistenciaHandler()
	eleccionHandler := handlers.NewEleccionHandler()
	vigilanciaAccesoHandler := handlers.NewVigilanciaAccesoHandler()
	vigilanciaPersonaHandler := handlers.NewVigilanciaPersonaHandler()
	complementariosHandler := handlers.NewComplementariosHandler()

	// Rutas públicas
	api := r.Group("/api")
	{
		api.GET("/version", handlers.GetVersion)

		// WebSocket dashboard asistencia (token por query; solo superadmin; sin AuthMiddleware)
		api.GET("/asistencias/dashboard/ws", handlers.DashboardWebSocket)
		registerCarnetImpresora(api, database.DB)

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
				personas.GET(routeImportTemplate, middleware.RequirePermission("persona", permCrearPersona), personaHandler.DownloadPersonaImportTemplate)
				personas.GET(routeImports, middleware.RequirePermission("persona", permVerPersonas), personaHandler.ListPersonaImports)
				personas.POST(routeImport, middleware.RequirePermission("persona", permCrearPersona), personaHandler.ImportPersonas)
				personas.PUT("/mi-perfil", middleware.RequirePermission("persona", permEditarMiPersona), personaHandler.UpdateMiPerfil)
				registerPersonaFotoYCarnet(protected, personas, database.DB)
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
				catalogos.GET(routeJornadas, catalogoHandler.GetJornadas)
				catalogos.GET("/dias-formacion", catalogoHandler.GetDiasFormacion)
			}
			catalogosPersona := protected.Group("/catalogos")
			catalogosPersona.Use(middleware.RequirePermissionCatalogosPersona())
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
				fichas.GET("/por-numero/:fichaNumero", middleware.RequirePermissionLeerFichaPorNumero(), fichaHandler.GetByNumero)
				fichas.GET("/:id/detalle", middleware.RequirePermissionLeerFichaIndividual(), fichaHandler.GetByIDWithDetail)
				fichas.GET("/:id/codigo", middleware.RequirePermissionVerFichaOrInstructorDeFicha(), fichaHandler.GetCodigo)
				fichas.GET("/:id", middleware.RequirePermissionLeerFichaIndividual(), fichaHandler.GetByID)
				fichas.GET(routeImport+"/template", middleware.RequirePermission("ficha", permCrearFicha), fichaHandler.DownloadFichaImportTemplate)
				fichas.POST(routeImport, middleware.RequirePermission("ficha", permCrearFicha), fichaHandler.ImportFichas)
				fichas.GET("/export/all", middleware.RequirePermission("ficha", permVerFichas), fichaHandler.ExportAllExcel)
				fichas.POST("", middleware.RequirePermission("ficha", permCrearFicha), fichaHandler.Create)
				fichas.PUT("/:id", middleware.RequirePermission("ficha", "EDITAR FICHA"), fichaHandler.Update)
				fichas.DELETE("/:id", middleware.RequirePermission("ficha", "ELIMINAR FICHA"), fichaHandler.Delete)
				fichas.GET("/:id/instructores", middleware.RequirePermissionListInstructoresFicha(), fichaHandler.ListInstructores)
				fichas.GET("/:id/agenda", middleware.RequirePermission("ficha", permProgramarInstructores), agendaHandler.GetAgendaFicha)
				fichas.POST("/:id/instructores", middleware.RequirePermission("ficha", permProgramarInstructores), fichaHandler.AsignarInstructores)
				fichas.POST("/:id/instructores/traslado-dia", middleware.RequirePermission("ficha", permProgramarInstructores), fichaHandler.TrasladarDiaInstructor)
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
			instructores.GET(routeImports, middleware.RequirePermission("instructor", permCrearInstructor), instructorHandler.ListInstructorImports)
			instructores.POST(routeImport, middleware.RequirePermission("instructor", permCrearInstructor), instructorHandler.ImportInstructores)
			instructores.GET("/:id", middleware.RequirePermission("ficha", permVerFichas), instructorHandler.GetByID)
			instructores.POST("", middleware.RequirePermission("instructor", permCrearInstructor), instructorHandler.CreateFromPersona)
			instructores.PUT("/:id", middleware.RequirePermission("instructor", "EDITAR INSTRUCTOR"), instructorHandler.Update)
			instructores.DELETE("/:id", middleware.RequirePermission("instructor", "ELIMINAR INSTRUCTOR"), instructorHandler.Delete)

			personalOperativoApoyo := protected.Group("/" + objPersOpApoyo)
			personalOperativoApoyo.GET("", middleware.RequirePermission(objPersOpApoyo, permVerPersonalOperativoYDeApoyo), personalOperativoApoyoHandler.GetAll)
			personalOperativoApoyo.GET(routeImportTemplate, middleware.RequirePermission(objPersOpApoyo, permCrearPersonalOperativoYDeApoyo), personalOperativoApoyoHandler.DownloadTemplate)
			personalOperativoApoyo.GET(routeImports, middleware.RequirePermission(objPersOpApoyo, permVerPersonalOperativoYDeApoyo), personalOperativoApoyoHandler.ListImports)
			personalOperativoApoyo.POST(routeImport, middleware.RequirePermission(objPersOpApoyo, permCrearPersonalOperativoYDeApoyo), personalOperativoApoyoHandler.ImportRolPersonal)
			personalOperativoApoyo.GET("/:id", middleware.RequirePermission(objPersOpApoyo, permVerPersonalOperativoYDeApoyo), personalOperativoApoyoHandler.GetByID)
			personalOperativoApoyo.POST("", middleware.RequirePermission(objPersOpApoyo, permCrearPersonalOperativoYDeApoyo), personalOperativoApoyoHandler.CreateFromPersona)
			personalOperativoApoyo.PUT("/:id", middleware.RequirePermission(objPersOpApoyo, permEditarPersonalOperativoYDeApoyo), personalOperativoApoyoHandler.Update)
			personalOperativoApoyo.DELETE("/:id", middleware.RequirePermission(objPersOpApoyo, permEliminarPersonalOperativoYDeApoyo), personalOperativoApoyoHandler.Delete)

			contratistas := protected.Group("/contratistas")
			contratistas.GET("", middleware.RequirePermission("contratista", permVerContratista), contratistaHandler.GetAll)
			contratistas.GET(routeImportTemplate, middleware.RequirePermission("contratista", permCrearContratista), contratistaHandler.DownloadTemplate)
			contratistas.GET(routeImports, middleware.RequirePermission("contratista", permVerContratista), contratistaHandler.ListImports)
			contratistas.POST(routeImport, middleware.RequirePermission("contratista", permCrearContratista), contratistaHandler.ImportRolPersonal)
			contratistas.GET("/:id", middleware.RequirePermission("contratista", permVerContratista), contratistaHandler.GetByID)
			contratistas.POST("", middleware.RequirePermission("contratista", permCrearContratista), contratistaHandler.CreateFromPersona)
			contratistas.PUT("/:id", middleware.RequirePermission("contratista", permEditarContratista), contratistaHandler.Update)
			contratistas.DELETE("/:id", middleware.RequirePermission("contratista", permEliminarContratista), contratistaHandler.Delete)

			personalAdministrativo := protected.Group("/" + objPersAdmin)
			personalAdministrativo.GET("", middleware.RequirePermission(objPersAdmin, permVerPersonalAdministrativo), personalAdministrativoHandler.GetAll)
			personalAdministrativo.GET(routeImportTemplate, middleware.RequirePermission(objPersAdmin, permCrearPersonalAdministrativo), personalAdministrativoHandler.DownloadTemplate)
			personalAdministrativo.GET(routeImports, middleware.RequirePermission(objPersAdmin, permVerPersonalAdministrativo), personalAdministrativoHandler.ListImports)
			personalAdministrativo.POST(routeImport, middleware.RequirePermission(objPersAdmin, permCrearPersonalAdministrativo), personalAdministrativoHandler.ImportRolPersonal)
			personalAdministrativo.GET("/:id", middleware.RequirePermission(objPersAdmin, permVerPersonalAdministrativo), personalAdministrativoHandler.GetByID)
			personalAdministrativo.POST("", middleware.RequirePermission(objPersAdmin, permCrearPersonalAdministrativo), personalAdministrativoHandler.CreateFromPersona)
			personalAdministrativo.PUT("/:id", middleware.RequirePermission(objPersAdmin, permEditarPersonalAdministrativo), personalAdministrativoHandler.Update)
			personalAdministrativo.DELETE("/:id", middleware.RequirePermission(objPersAdmin, permEliminarPersonalAdministrativo), personalAdministrativoHandler.Delete)

			asistencias := protected.Group("/asistencias")
			// Dashboard de asistencia: SUPER ADMINISTRADOR y BIENESTAR AL APRENDIZ
			asistencias.GET("/dashboard", middleware.RequireSuperAdminOrBienestar(), asistenciaHandler.GetDashboard)
			// Casos de Bienestar: oficina (superadmin/bienestar) o instructor líder (alcance a sus fichas)
			asistencias.GET("/dashboard/casos-bienestar", middleware.RequireSuperAdminBienestarOrInstructor(), asistenciaHandler.GetCasosBienestar)
			asistencias.GET("/dashboard/casos-bienestar/ficha/:fichaNumero/aprendiz/:aprendizId/detalle", middleware.RequireSuperAdminBienestarOrInstructor(), asistenciaHandler.GetDetalleInasistenciasAprendiz)
			asistencias.GET("/dashboard/alertas-consecutivas", middleware.RequireSuperAdminBienestarOrInstructor(), asistenciaHandler.GetAlertasConsecutivas)
			asistencias.GET("/mis-inasistencias", middleware.RequirePermission("asistencia", permVerMisInasistencias), asistenciaHandler.GetMisInasistencias)
			asistencias.GET("/mis-alertas-consecutivas", middleware.RequirePermission("asistencia", permVerMisInasistencias), asistenciaHandler.GetMisAlertasConsecutivas)
			asistencias.GET("/dashboard/pendientes-revision-instructor", middleware.RequireSuperAdminOrBienestar(), asistenciaHandler.ListPendientesRevisionAdmin)
			asistencias.GET("/dashboard/sesiones-sin-asistencia-tomada", middleware.RequireSuperAdminAdminOrCoordinator(), asistenciaHandler.GetSesionesSinAsistenciaTomada)
			// Entrar a tomar asistencia: solo requiere estar autenticado; el servicio valida que el usuario sea instructor asignado a la ficha.
			asistencias.POST("/entrar-tomar-asistencia", asistenciaHandler.EntrarTomarAsistencia)
			asistencias.GET("/reglas", asistenciaHandler.GetReglas)
			asistencias.POST("", middleware.RequirePermission("asistencia", permTomarAsistencia), asistenciaHandler.CreateSesion)
			asistencias.POST("/carga-retroactiva", middleware.RequireSuperAdmin(), asistenciaHandler.RegistrarAsistenciaRetroactiva)
			asistencias.GET("/instructor-ficha/:instructorFichaId", middleware.RequirePermission("asistencia", permVerAsistencia), asistenciaHandler.ListByInstructorFicha)
			asistencias.GET("/ficha/:fichaId", middleware.RequirePermissionListAsistenciasPorFicha(), asistenciaHandler.ListByFichaAndFechas)
			// Pendientes de revisión:
			// ya se valida dentro del handler que el usuario autenticado
			// esté vinculado como instructor. No se requiere permiso Casbin adicional.
			asistencias.GET("/pendientes-revision", asistenciaHandler.ListPendientesRevision)
			asistencias.POST("/ingreso", middleware.RequirePermission("asistencia", permTomarAsistencia), asistenciaHandler.RegistrarIngreso)
			asistencias.POST("/ingreso-por-documento", middleware.RequirePermission("asistencia", permTomarAsistencia), asistenciaHandler.RegistrarIngresoPorDocumento)
			asistencias.PUT("/:id/finalizar-sesion", middleware.RequirePermission("asistencia", permTomarAsistencia), asistenciaHandler.FinalizarSesion)
			asistencias.PUT("/:id/observaciones-sesion", middleware.RequirePermission("asistencia", permTomarAsistencia), asistenciaHandler.ActualizarObservacionesSesion)
			asistencias.PUT("/aprendiz/:asistenciaAprendizId/salida", middleware.RequirePermission("asistencia", permTomarAsistencia), asistenciaHandler.RegistrarSalida)
			asistencias.DELETE("/aprendiz/:asistenciaAprendizId", middleware.RequireSuperAdminOrAdmin(), asistenciaHandler.EliminarRegistroAprendiz)
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
			admin.POST("/sync-aprendiz-roles", middleware.RequirePermission("ficha", permVerFichas), adminHandler.SyncAprendizRoles)
			admin.POST("/sync-aprendiz-permissions", middleware.RequireSuperAdminOrAdmin(), adminHandler.SyncAprendizPermissions)
			admin.POST("/sync-agenda-permissions", middleware.RequireSuperAdminOrAdmin(), adminHandler.SyncAgendaPermissions)
			// sync-inventario-permissions desactivado (módulo inventario no en uso)

			administracion := protected.Group("/administracion")
			administracion.Use(middleware.RequireSuperAdminAdminOrCoordinator())
			{
				administracion.GET(routeJornadas, jornadaHandler.List)
				administracion.POST(routeJornadas, jornadaHandler.Create)
				administracion.PUT(routeJornadas+"/:id", jornadaHandler.Update)
				administracion.POST(routeJornadas+"/:id/propagar", jornadaHandler.Propagar)
				administracion.DELETE(routeJornadas+"/:id", jornadaHandler.Delete)

				administracion.GET(routeDiasSinFormacion, diaSinFormacionHandler.List)
				administracion.POST(routeDiasSinFormacion, diaSinFormacionHandler.Create)
				administracion.PUT(routeDiasSinFormacion+"/:id", diaSinFormacionHandler.Update)
				administracion.DELETE(routeDiasSinFormacion+"/:id", diaSinFormacionHandler.Delete)

				administracion.GET(routeDiasSinFormacionFicha, diaSinFormacionFichaHandler.List)
				administracion.POST(routeDiasSinFormacionFicha, diaSinFormacionFichaHandler.Create)
				administracion.DELETE(routeDiasSinFormacionFicha+"/:id", diaSinFormacionFichaHandler.Delete)

				administracion.GET(routeConfiguracionAsistencia, configAsistenciaHandler.Get)
				administracion.PUT(routeConfiguracionAsistencia, configAsistenciaHandler.Update)
			}

			// Gestión de permisos y roles (ASIGNAR PERMISOS o SUPER ADMIN para roles)
			permisos := protected.Group("/permisos")
			permisos.Use(middleware.RequirePermission("usuario", "ASIGNAR PERMISOS"))
			{
				permisos.GET("/definiciones", permisosHandler.Definiciones)
			}
			usuarios := protected.Group(routeUsuarios)
			usuarios.Use(middleware.RequirePermission("usuario", "ASIGNAR PERMISOS"))
			{
				usuarios.GET("", permisosHandler.ListUsuarios)
				usuarios.GET("/:id/permisos", permisosHandler.GetPermisos)
				usuarios.POST("/:id/permisos", permisosHandler.AsignarPermiso)
				usuarios.DELETE("/:id/permisos/:obj/:act", permisosHandler.QuitarPermiso)
				usuarios.PATCH("/:id/estado", permisosHandler.ToggleEstado)
			}
			usuariosRoles := protected.Group(routeUsuarios)
			usuariosRoles.Use(middleware.RequireSuperAdmin())
			{
				usuariosRoles.PATCH("/:id/roles", permisosHandler.SetRoles)
			}
			usuariosRegionales := protected.Group(routeUsuarios)
			usuariosRegionales.Use(middleware.RequireSuperAdminOrAdmin())
			{
				usuariosRegionales.GET("/:id/regionales", permisosHandler.GetUsuarioRegionales)
				usuariosRegionales.PUT("/:id/regionales", permisosHandler.SetUsuarioRegionales)
			}

			stats := protected.Group("/stats")
			stats.Use(middleware.RequireDashboardStats())
			{
				stats.GET("/dashboard-resumen", statsHandler.GetDashboardResumen)
				stats.GET("/asistencia-analisis", statsHandler.GetAsistenciaAnalisis)
				stats.GET("/asistencia-analisis/explorar-fichas", statsHandler.GetAsistenciaAnalisisExplorarFichas)
				stats.GET("/asistencia-analisis/aprendices-ficha", statsHandler.GetAsistenciaAnalisisAprendicesFicha)
				stats.GET("/asistencia-analisis/registros-aprendiz", statsHandler.GetAsistenciaAnalisisRegistrosAprendiz)
			}

			elecciones := protected.Group("/elecciones")
			registerEleccionRoutes(elecciones, eleccionHandler)

			vigilancia := protected.Group("/vigilancia/acceso")
			{
				vigilancia.POST("/lookup", middleware.RequirePermission("vigilancia", permRegistrarAccesoSede), vigilanciaAccesoHandler.Lookup)
				vigilancia.POST("/ingreso", middleware.RequirePermission("vigilancia", permRegistrarAccesoSede), vigilanciaAccesoHandler.Ingreso)
				vigilancia.POST("/salida", middleware.RequirePermission("vigilancia", permRegistrarAccesoSede), vigilanciaAccesoHandler.Salida)
				vigilancia.POST("/cancelar-ingreso", middleware.RequirePermission("vigilancia", permRegistrarAccesoSede), vigilanciaAccesoHandler.CancelarIngreso)
				vigilancia.GET("/foto", middleware.RequirePermission("vigilancia", permRegistrarAccesoSede), vigilanciaAccesoHandler.VerFotoAcceso)
				vigilancia.GET("/dentro", middleware.RequirePermission("vigilancia", permVerAccesoSede), vigilanciaAccesoHandler.ListDentro)
				vigilancia.GET("/historial", middleware.RequirePermission("vigilancia", permVerAccesoSede), vigilanciaAccesoHandler.Historial)
				vigilancia.GET("/estadisticas", middleware.RequirePermission("vigilancia", permVerAccesoSede), vigilanciaAccesoHandler.Estadisticas)
			}

	vigilanciaPersonas := protected.Group("/vigilancia/personas")
		{
			vigilanciaPersonas.GET("/lookup", middleware.RequirePermission("persona", permRegistrarPersona), vigilanciaPersonaHandler.Lookup)
			vigilanciaPersonas.PUT("/:id/datos-basicos", middleware.RequirePermission("persona", permRegistrarPersona), vigilanciaPersonaHandler.ActualizarDatosBasicos)
			vigilanciaPersonas.POST("/:id/foto", middleware.RequirePermission("persona", permRegistrarPersona), vigilanciaPersonaHandler.SubirFoto)
		}

		cambiosPendientes := protected.Group("/cambios-pendientes")
		{
			cambiosPendientes.GET("", middleware.RequirePermission("persona", permRegistrarPersona), handlers.NewPersonaCambioPendienteHandler().ListarPendientes)
			cambiosPendientes.GET("/mi-estado", handlers.NewPersonaCambioPendienteHandler().VerificarPendiente)
			cambiosPendientes.GET("/:id/foto", middleware.RequirePermission("persona", permRegistrarPersona), handlers.NewPersonaCambioPendienteHandler().VerFotoPendiente)
			cambiosPendientes.PUT("/:id/aprobar", middleware.RequirePermission("persona", permRegistrarPersona), handlers.NewPersonaCambioPendienteHandler().Aprobar)
			cambiosPendientes.PUT("/:id/rechazar", middleware.RequirePermission("persona", permRegistrarPersona), handlers.NewPersonaCambioPendienteHandler().Rechazar)
		}

			// Complementarios (FPI): credenciales SofiaPlus por operador + verificación de aspirantes
			const rutaCredencialesSofia = "/credenciales"
			complementarios := protected.Group("/complementarios")
			complementarios.Use(middleware.RequireSuperAdminAdminOrCoordinator())
			{
				complementarios.GET(rutaCredencialesSofia, complementariosHandler.GetCredencialEstado)
				complementarios.POST(rutaCredencialesSofia, complementariosHandler.GuardarCredencial)
				complementarios.DELETE(rutaCredencialesSofia, complementariosHandler.EliminarCredencial)
				complementarios.POST("/verificar-aspirante", complementariosHandler.VerificarAspirante)
				complementarios.POST("/consultar-inscripciones", complementariosHandler.ConsultarInscripciones)
				complementarios.GET("/inscripciones/plantilla", complementariosHandler.DescargarPlantillaInscripciones)
				complementarios.POST("/inscripciones/consultar-lote", complementariosHandler.ConsultarInscripcionesLote)
				complementarios.POST("/inscripciones/consultar-lote/reintentar", complementariosHandler.ReintentarInscripciones)
				complementarios.GET("/inscripciones/consultar-lote/progreso/:lote_id", complementariosHandler.ProgresoLote)
				complementarios.GET("/inscripciones/consultar-lote/resultados/:lote_id", complementariosHandler.ResultadosLoteInscripciones)
				complementarios.GET("/plantilla", complementariosHandler.DescargarPlantilla)
				complementarios.POST("/verificar-lote", complementariosHandler.VerificarLote)
				complementarios.POST("/verificar-lote/reintentar", complementariosHandler.ReintentarVerificacion)
				complementarios.GET("/verificar-lote/progreso/:lote_id", complementariosHandler.ProgresoLote)
				complementarios.GET("/verificar-lote/resultados/:lote_id", complementariosHandler.ResultadosLote)

				betowa := complementarios.Group("/betowa")
				{
					betowa.POST("/verificar-aspirante", complementariosHandler.VerificarAspiranteBetowa)
					betowa.POST("/verificar-lote", complementariosHandler.VerificarLoteBetowa)
				}
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
