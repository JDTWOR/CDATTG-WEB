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
	if err := seedVerPersonaForRoles(e, []string{"APRENDIZ", "VISITANTE", "ASPIRANTE", "PROVEEDOR"}); err != nil {
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
	if err := addPermissionsForObject(e, "INSTRUCTOR", authz.ObjAsistencia, authz.PermisosAsistencia); err != nil {
		return err
	}
	if _, err := authz.AddPermissionForRole(e, "INSTRUCTOR", authz.ObjPersona, "VER PERSONA"); err != nil {
		return err
	}
	return nil
}

func seedVerPersonaForRoles(e *casbin.Enforcer, roleNames []string) error {
	for _, roleName := range roleNames {
		if _, err := authz.AddPermissionForRole(e, roleName, authz.ObjPersona, "VER PERSONA"); err != nil {
			return err
		}
	}
	return nil
}

// SyncInventarioPermissionsToRoles: inventario desactivado, no hace nada.
func SyncInventarioPermissionsToRoles(db *gorm.DB) error {
	log.Println("Inventario desactivado: SyncInventarioPermissionsToRoles omitido.")
	return nil
}
