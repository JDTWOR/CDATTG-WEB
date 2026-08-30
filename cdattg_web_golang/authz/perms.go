package authz

// Rol y permisos centralizados: única fuente de definición para seed y API.
// obj = recurso (persona, programa, ficha, ...), act = acción (VER PERSONA, CREAR FICHA, ...).

// RoleNames lista todos los roles del sistema.
var RoleNames = []string{
	"BOT",
	"SUPER ADMINISTRADOR",
	"ADMINISTRADOR",
	"VIGILANTE",
	"COORDINADOR",
	"INSTRUCTOR",
	"VISITANTE",
	"APRENDIZ",
	"ASPIRANTE",
	"PROVEEDOR",
	// Rol especializado para oficina de bienestar al aprendiz (acceso a dashboard y casos de bienestar)
	"BIENESTAR AL APRENDIZ",
	// Rol solo para módulo FPI (Sofía / Betowa / complementarios)
	"FPI",
	// Ve carnets regulares ya validados para imprimir el físico
	"BIBLIOTECARIO",
	// Roles del módulo Personal (se toman rol al vincular una persona a un rol de personal)
	"PERSONAL OPERATIVO Y DE APOYO",
	"PERSONAL ADMINISTRATIVO",
	"CONTRATISTA PRESTACIÓN DE SERVICIOS",
}

// Permisos por objeto (obj). Se usan en Casbin como (roleName o userID, obj, act).
var (
	PermisosPersona = []string{
		"CREAR PERSONA", ActVerPersona, ActEditarMiPersona, "VER PERSONAS", "EDITAR PERSONA", "ELIMINAR PERSONA",
		"CAMBIAR ESTADO PERSONA", "RESTABLECER PASSWORD",
	}
	PermisosPrograma = []string{
		"VER PROGRAMAS", "VER PROGRAMA", "CREAR PROGRAMA", "EDITAR PROGRAMA", "ELIMINAR PROGRAMA",
	}
	PermisosFicha = []string{
		"VER FICHAS", "VER FICHA", "CREAR FICHA", "EDITAR FICHA", "ELIMINAR FICHA",
		"GESTIONAR INSTRUCTORES FICHA", "GESTIONAR APRENDICES FICHA",
		"PROGRAMAR INSTRUCTORES",
	}
	PermisosAprendiz = []string{
		"VER APRENDICES", "VER APRENDIZ", "CREAR APRENDIZ", "EDITAR APRENDIZ", "ELIMINAR APRENDIZ",
	}
	PermisosInstructor = []string{
		"VER INSTRUCTORES", "CREAR INSTRUCTOR", "EDITAR INSTRUCTOR", "ELIMINAR INSTRUCTOR",
	}
	PermisosPersonalOperativoYDeApoyo = []string{
		"VER PERSONAL OPERATIVO Y DE APOYO", "CREAR PERSONAL OPERATIVO Y DE APOYO", "EDITAR PERSONAL OPERATIVO Y DE APOYO", "ELIMINAR PERSONAL OPERATIVO Y DE APOYO",
	}
	PermisosPersonalAdministrativo = []string{
		"VER PERSONAL ADMINISTRATIVO", "CREAR PERSONAL ADMINISTRATIVO", "EDITAR PERSONAL ADMINISTRATIVO", "ELIMINAR PERSONAL ADMINISTRATIVO",
	}
	PermisosContratista = []string{
		"VER CONTRATISTAS PRESTACIÓN DE SERVICIOS", "CREAR CONTRATISTAS PRESTACIÓN DE SERVICIOS", "EDITAR CONTRATISTAS PRESTACIÓN DE SERVICIOS", "ELIMINAR CONTRATISTAS PRESTACIÓN DE SERVICIOS",
	}
	PermisosAsistencia = []string{
		"VER ASISTENCIA", "TOMAR ASISTENCIA", "VER MI AGENDA", "VER MIS INASISTENCIAS",
	}
	PermisosEleccion = []string{
		"GESTIONAR ELECCION", "VER ELECCION", "VOTAR ELECCION", "VER RESULTADOS ELECCION",
	}
	// PermisosInventario desactivado: módulo inventario no en uso
	PermisosInventario = []string{}
	PermisosUsuario = []string{
		"CREAR USUARIO", "ASIGNAR PERMISOS",
	}
	PermisosVigilancia = []string{
		ActRegistrarAccesoSede,
		ActVerAccesoSede,
	}
	PermisosLMS = []string{
		ActVerLMS,
		ActEntrarAulaLMS,
		ActPublicarActividadLMS,
	}
	PermisosCarnet = []string{ActVerCarnetDigital, ActValidarCarnetDigital, ActVerCarnetBiblioteca}
	PermisosSemillero = []string{
		ActGestionarSemillero,
	}
)

// ObjPersona, ObjPrograma, ... nombres de objeto usados en rutas y Casbin.
// ActVerPersona y demás act* son acciones Casbin (act) reutilizables en seed y middleware.
const (
	ActVerPersona           = "VER PERSONA"
	ActEditarMiPersona      = "EDITAR MI PERSONA"
	ActRegistrarAccesoSede  = "REGISTRAR ACCESO SEDE"
	ActVerAccesoSede        = "VER ACCESO SEDE"
	ActVerLMS               = "VER LMS"
	ActEntrarAulaLMS        = "ENTRAR AULA"
	ActPublicarActividadLMS = "PUBLICAR ACTIVIDAD"
	ActVerCarnetDigital     = "VER CARNET DIGITAL"
	ActValidarCarnetDigital = "VALIDAR CARNET DIGITAL"
	ActVerCarnetBiblioteca  = "VER CARNET BIBLIOTECA"
	ActGestionarSemillero   = "GESTIONAR SEMILLERO"

	ObjPersona     = "persona"
	ObjPrograma    = "programa"
	ObjFicha       = "ficha"
	ObjAprendiz    = "aprendiz"
	ObjInstructor  = "instructor"
	ObjPersonalOperativoYDeApoyo = "personal-operativo-apoyo"
	ObjPersonalAdministrativo = "personal-administrativo"
	ObjContratista         = "contratista"
	ObjAsistencia  = "asistencia"
	ObjEleccion    = "eleccion"
	ObjUsuario     = "usuario"
	ObjVigilancia  = "vigilancia"
	ObjLMS         = "lms"
	ObjCarnet      = "carnet"
	ObjSemillero   = "semillero"
	ObjInventario = "inventario"
	ObjProducto   = "producto"
	ObjOrden      = "orden"
	ObjDevolucion = "devolucion"
	ObjProveedor  = "proveedor"
	ObjCategoria  = "categoria"
	ObjMarca      = "marca"
	ObjContrato   = "contrato"
)

// Roles del módulo Personal: usados al vincular una persona a un rol de personal.
const (
	RolPersonalOperativoYDeApoyo       = "PERSONAL OPERATIVO Y DE APOYO"
	RolPersonalAdministrativo          = "PERSONAL ADMINISTRATIVO"
	RolContratistaPrestacionServicios = "CONTRATISTA PRESTACIÓN DE SERVICIOS"
	RolBibliotecario                  = "BIBLIOTECARIO"
)

// IsValidPermiso indica si (obj, act) es un permiso definido en el sistema.
func IsValidPermiso(obj, act string) bool {
	for _, p := range AllPermissionPairs() {
		if p.Obj == obj && p.Act == act {
			return true
		}
	}
	return false
}

// AllPermissionPairs devuelve todos los (obj, act) válidos para listados y validación en API.
func AllPermissionPairs() []struct{ Obj, Act string } {
	out := make([]struct{ Obj, Act string }, 0)
	for _, act := range PermisosPersona {
		out = append(out, struct{ Obj, Act string }{ObjPersona, act})
	}
	for _, act := range PermisosPrograma {
		out = append(out, struct{ Obj, Act string }{ObjPrograma, act})
	}
	for _, act := range PermisosFicha {
		out = append(out, struct{ Obj, Act string }{ObjFicha, act})
	}
	for _, act := range PermisosAprendiz {
		out = append(out, struct{ Obj, Act string }{ObjAprendiz, act})
	}
	for _, act := range PermisosInstructor {
		out = append(out, struct{ Obj, Act string }{ObjInstructor, act})
	}
	for _, act := range PermisosPersonalOperativoYDeApoyo {
		out = append(out, struct{ Obj, Act string }{ObjPersonalOperativoYDeApoyo, act})
	}
	for _, act := range PermisosPersonalAdministrativo {
		out = append(out, struct{ Obj, Act string }{ObjPersonalAdministrativo, act})
	}
	for _, act := range PermisosContratista {
		out = append(out, struct{ Obj, Act string }{ObjContratista, act})
	}
	for _, act := range PermisosAsistencia {
		out = append(out, struct{ Obj, Act string }{ObjAsistencia, act})
	}
	for _, act := range PermisosEleccion {
		out = append(out, struct{ Obj, Act string }{ObjEleccion, act})
	}
	for _, act := range PermisosUsuario {
		out = append(out, struct{ Obj, Act string }{ObjUsuario, act})
	}
	for _, act := range PermisosVigilancia {
		out = append(out, struct{ Obj, Act string }{ObjVigilancia, act})
	}
	for _, act := range PermisosLMS {
		out = append(out, struct{ Obj, Act string }{ObjLMS, act})
	}
	for _, act := range PermisosCarnet {
		out = append(out, struct{ Obj, Act string }{ObjCarnet, act})
	}
	for _, act := range PermisosSemillero {
		out = append(out, struct{ Obj, Act string }{ObjSemillero, act})
	}
	// Inventario desactivado: no se añaden permisos de inventario a AllPermissionPairs
	return out
}
