package seeders

import (
	"log"

	casbin "github.com/casbin/casbin/v3"
	"github.com/sena/cdattg-web-golang/authz"
	"gorm.io/gorm"
)

// RunRolePermissionSeeder pobla solo Casbin (única fuente de verdad). Roles y permisos definidos en authz/perms.go.
func RunRolePermissionSeeder(db *gorm.DB) error {
	log.Println("Ejecutando RolePermissionSeeder (solo Casbin)...")

	e, err := authz.GetEnforcer(db)
	if err != nil {
		return err
	}

	if _, err := authz.AddPermissionForRoleWildcard(e, "SUPER ADMINISTRADOR"); err != nil {
		return err
	}

	if err := seedAdminOrCoordinatorStack(e, "ADMINISTRADOR", true); err != nil {
		return err
	}
	if err := seedAdminOrCoordinatorStack(e, "COORDINADOR", false); err != nil {
		return err
	}
	if err := seedInstructorPermissions(e); err != nil {
		return err
	}
	if err := syncAgendaPermissions(e); err != nil {
		return err
	}
	if err := seedVerPersonaForRoles(e, []string{"VISITANTE", "ASPIRANTE", "PROVEEDOR"}); err != nil {
		return err
	}
	if err := seedAprendizPermissions(e); err != nil {
		return err
	}
	if err := seedEleccionPermissions(e); err != nil {
		return err
	}
	if err := seedVigilanciaPermissions(e); err != nil {
		return err
	}
	if err := seedPersonalRolPermissions(e); err != nil {
		return err
	}
	if err := seedFPIPermissions(e); err != nil {
		return err
	}
	if err := seedBibliotecarioPermissions(e); err != nil {
		return err
	}
	if err := seedAccesoEstudiosPermissions(e); err != nil {
		return err
	}

	if err := e.SavePolicy(); err != nil {
		return err
	}
	log.Println("RolePermissionSeeder completado.")
	return nil
}

func addPermissionsForObject(e *casbin.Enforcer, roleName, obj string, perms []string) error {
	for _, perm := range perms {
		if _, err := authz.AddPermissionForRole(e, roleName, obj, perm); err != nil {
			return err
		}
	}
	return nil
}

// seedAdminOrCoordinatorStack aplica persona, programa, ficha, aprendiz, instructor, asistencia; si withUsuario, también usuario (ASIGNAR PERMISOS).
func seedAdminOrCoordinatorStack(e *casbin.Enforcer, role string, withUsuario bool) error {
	if err := addPermissionsForObject(e, role, authz.ObjPersona, authz.PermisosPersona); err != nil {
		return err
	}
	if err := addPermissionsForObject(e, role, authz.ObjPrograma, authz.PermisosPrograma); err != nil {
		return err
	}
	if err := addPermissionsForObject(e, role, authz.ObjFicha, authz.PermisosFicha); err != nil {
		return err
	}
	if err := addPermissionsForObject(e, role, authz.ObjAprendiz, authz.PermisosAprendiz); err != nil {
		return err
	}
	if err := addPermissionsForObject(e, role, authz.ObjInstructor, authz.PermisosInstructor); err != nil {
		return err
	}
	if err := addPermissionsForObject(e, role, authz.ObjAsistencia, authz.PermisosAsistencia); err != nil {
		return err
	}
	if withUsuario {
		return addPermissionsForObject(e, role, authz.ObjUsuario, authz.PermisosUsuario)
	}
	return nil
}

func seedInstructorPermissions(e *casbin.Enforcer) error {
	if _, err := authz.RemoveFilteredPolicyForRole(e, "INSTRUCTOR", authz.ObjPersona); err != nil {
		return err
	}
	instructorAsistencia := []string{"VER ASISTENCIA", "TOMAR ASISTENCIA", "VER MI AGENDA"}
	if err := addPermissionsForObject(e, "INSTRUCTOR", authz.ObjAsistencia, instructorAsistencia); err != nil {
		return err
	}
	if _, err := authz.AddPermissionForRole(e, "INSTRUCTOR", authz.ObjPersona, authz.ActVerPersona); err != nil {
		return err
	}
	if _, err := authz.AddPermissionForRole(e, "INSTRUCTOR", authz.ObjPersona, authz.ActEditarMiPersona); err != nil {
		return err
	}
	if _, err := authz.AddPermissionForRole(e, "INSTRUCTOR", authz.ObjCarnet, authz.ActValidarCarnetDigital); err != nil {
		return err
	}
	return nil
}

// syncAgendaPermissions asegura PROGRAMAR INSTRUCTORES en coordinación/admin y VER MI AGENDA en instructor.
func syncAgendaPermissions(e *casbin.Enforcer) error {
	for _, role := range []string{"ADMINISTRADOR", "COORDINADOR"} {
		if _, err := authz.AddPermissionForRole(e, role, authz.ObjFicha, "PROGRAMAR INSTRUCTORES"); err != nil {
			return err
		}
	}
	if _, err := authz.AddPermissionForRole(e, "INSTRUCTOR", authz.ObjAsistencia, "VER MI AGENDA"); err != nil {
		return err
	}
	return nil
}

// SyncAgendaPermissionsToRoles idempotente para despliegues existentes (sin re-ejecutar el seeder completo).
func SyncAgendaPermissionsToRoles(db *gorm.DB) error {
	log.Println("Sincronizando permisos de agenda/programación...")
	e, err := authz.GetEnforcer(db)
	if err != nil {
		return err
	}
	if err := syncAgendaPermissions(e); err != nil {
		return err
	}
	return e.SavePolicy()
}

func seedAprendizPermissions(e *casbin.Enforcer) error {
	if _, err := authz.AddPermissionForRole(e, "APRENDIZ", authz.ObjPersona, authz.ActVerPersona); err != nil {
		return err
	}
	if _, err := authz.AddPermissionForRole(e, "APRENDIZ", authz.ObjPersona, authz.ActEditarMiPersona); err != nil {
		return err
	}
	if _, err := authz.AddPermissionForRole(e, "APRENDIZ", authz.ObjAsistencia, "VER MIS INASISTENCIAS"); err != nil {
		return err
	}
	if _, err := authz.AddPermissionForRole(e, "APRENDIZ", authz.ObjCarnet, authz.ActVerCarnetDigital); err != nil {
		return err
	}
	return nil
}

func seedEleccionPermissions(e *casbin.Enforcer) error {
	adminPerms := []string{"GESTIONAR ELECCION", "VER ELECCION", "VER RESULTADOS ELECCION"}
	for _, role := range []string{"ADMINISTRADOR", "COORDINADOR"} {
		if err := addPermissionsForObject(e, role, authz.ObjEleccion, adminPerms); err != nil {
			return err
		}
	}
	aprendizPerms := []string{"VER ELECCION", "VOTAR ELECCION"}
	return addPermissionsForObject(e, "APRENDIZ", authz.ObjEleccion, aprendizPerms)
}

// SyncEleccionPermissionsToRoles idempotente para despliegues existentes.
func SyncEleccionPermissionsToRoles(db *gorm.DB) error {
	log.Println("Sincronizando permisos de elecciones...")
	e, err := authz.GetEnforcer(db)
	if err != nil {
		return err
	}
	if err := seedEleccionPermissions(e); err != nil {
		return err
	}
	return e.SavePolicy()
}

// SyncAprendizPermissionsToRoles aplica permisos Casbin de aprendiz y sincroniza roles (idempotente).
func SyncAprendizPermissionsToRoles(db *gorm.DB) error {
	log.Println("Sincronizando permisos y roles de aprendiz...")
	e, err := authz.GetEnforcer(db)
	if err != nil {
		return err
	}
	if err := seedAprendizPermissions(e); err != nil {
		return err
	}
	if err := e.SavePolicy(); err != nil {
		return err
	}
	return RunSyncAprendizRolesSeeder(db)
}

func seedVerPersonaForRoles(e *casbin.Enforcer, roleNames []string) error {
	for _, roleName := range roleNames {
		if _, err := authz.AddPermissionForRole(e, roleName, authz.ObjPersona, authz.ActVerPersona); err != nil {
			return err
		}
		if _, err := authz.AddPermissionForRole(e, roleName, authz.ObjPersona, authz.ActEditarMiPersona); err != nil {
			return err
		}
	}
	return nil
}

func seedVigilanciaPermissions(e *casbin.Enforcer) error {
	roles := []string{"VIGILANTE", "ADMINISTRADOR", "COORDINADOR"}
	for _, role := range roles {
		if err := addPermissionsForObject(e, role, authz.ObjVigilancia, authz.PermisosVigilancia); err != nil {
			return err
		}
		if _, err := authz.AddPermissionForRole(e, role, authz.ObjPersona, authz.ActVerPersona); err != nil {
			return err
		}
		if _, err := authz.AddPermissionForRole(e, role, authz.ObjPersona, authz.ActEditarMiPersona); err != nil {
			return err
		}
		if _, err := authz.AddPermissionForRole(e, role, authz.ObjPersona, authz.ActRegistrarPersonaVig); err != nil {
			return err
		}
	}
	return nil
}

// seedFPIPermissions: perfil mínimo para el módulo FPI (Sofía/Betowa) + ver/editar mi persona.
func seedFPIPermissions(e *casbin.Enforcer) error {
	return seedVerPersonaForRoles(e, []string{"FPI", "BIENESTAR AL APRENDIZ"})
}

// seedPersonalRolPermissions: administración de personal operativo, administrativo y contratistas.
// Los roles del módulo Personal solo ven/editan su propia persona.
func seedPersonalRolPermissions(e *casbin.Enforcer) error {
	for _, role := range []string{"ADMINISTRADOR", "COORDINADOR"} {
		if err := addPermissionsForObject(e, role, authz.ObjPersonalOperativoYDeApoyo, authz.PermisosPersonalOperativoYDeApoyo); err != nil {
			return err
		}
		if err := addPermissionsForObject(e, role, authz.ObjPersonalAdministrativo, authz.PermisosPersonalAdministrativo); err != nil {
			return err
		}
		if err := addPermissionsForObject(e, role, authz.ObjContratista, authz.PermisosContratista); err != nil {
			return err
		}
	}
	return seedVerPersonaForRoles(e, []string{authz.RolPersonalOperativoYDeApoyo, authz.RolPersonalAdministrativo, authz.RolContratistaPrestacionServicios})
}

// SyncInventarioPermissionsToRoles: inventario desactivado, no hace nada.
func SyncInventarioPermissionsToRoles(db *gorm.DB) error {
	log.Println("Inventario desactivado: SyncInventarioPermissionsToRoles omitido.")
	return nil
}
