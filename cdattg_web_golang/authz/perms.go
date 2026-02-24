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
}

// Permisos por objeto (obj). Se usan en Casbin como (roleName o userID, obj, act).
var (
	PermisosPersona = []string{
		"CREAR PERSONA", "VER PERSONA", "VER PERSONAS", "EDITAR PERSONA", "ELIMINAR PERSONA",
		"CAMBIAR ESTADO PERSONA", "RESTABLECER PASSWORD",
	}
	PermisosPrograma = []string{
		"VER PROGRAMAS", "VER PROGRAMA", "CREAR PROGRAMA", "EDITAR PROGRAMA", "ELIMINAR PROGRAMA",
	}
	PermisosFicha = []string{
		"VER FICHAS", "VER FICHA", "CREAR FICHA", "EDITAR FICHA", "ELIMINAR FICHA",
		"GESTIONAR INSTRUCTORES FICHA", "GESTIONAR APRENDICES FICHA",
	}
	PermisosAprendiz = []string{
		"VER APRENDICES", "VER APRENDIZ", "CREAR APRENDIZ", "EDITAR APRENDIZ", "ELIMINAR APRENDIZ",
	}
	PermisosInstructor = []string{
		"VER INSTRUCTORES", "CREAR INSTRUCTOR", "EDITAR INSTRUCTOR", "ELIMINAR INSTRUCTOR",
	}
	PermisosAsistencia = []string{
		"VER ASISTENCIA", "TOMAR ASISTENCIA",
	}
	// PermisosInventario desactivado: módulo inventario no en uso
	PermisosInventario = []string{}
	PermisosUsuario = []string{
		"CREAR USUARIO", "ASIGNAR PERMISOS",
	}
)

// ObjPersona, ObjPrograma, ... nombres de objeto usados en rutas y Casbin.
const (
	ObjPersona     = "persona"
	ObjPrograma    = "programa"
	ObjFicha       = "ficha"
	ObjAprendiz    = "aprendiz"
	ObjInstructor  = "instructor"
	ObjAsistencia  = "asistencia"
	ObjUsuario     = "usuario"
	ObjInventario  = "inventario"
	ObjProducto    = "producto"
	ObjOrden       = "orden"
	ObjDevolucion  = "devolucion"
	ObjProveedor   = "proveedor"
	ObjCategoria   = "categoria"
	ObjMarca       = "marca"
	ObjContrato    = "contrato"
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
	for _, act := range PermisosAsistencia {
		out = append(out, struct{ Obj, Act string }{ObjAsistencia, act})
	}
	for _, act := range PermisosUsuario {
		out = append(out, struct{ Obj, Act string }{ObjUsuario, act})
	}
	// Inventario desactivado: no se añaden permisos de inventario a AllPermissionPairs
	return out
}
