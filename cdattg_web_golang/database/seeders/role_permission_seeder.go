package seeders

import (
	"log"

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

	// SUPER ADMINISTRADOR: todos los permisos (*, *)
	if _, err := authz.AddPermissionForRoleWildcard(e, "SUPER ADMINISTRADOR"); err != nil {
		return err
	}

	// ADMINISTRADOR: persona, programa, ficha, aprendiz, instructor, asistencia, inventario, usuario (ASIGNAR PERMISOS)
	for _, perm := range authz.PermisosPersona {
		_, _ = authz.AddPermissionForRole(e, "ADMINISTRADOR", authz.ObjPersona, perm)
	}
	for _, perm := range authz.PermisosPrograma {
		_, _ = authz.AddPermissionForRole(e, "ADMINISTRADOR", authz.ObjPrograma, perm)
	}
	for _, perm := range authz.PermisosFicha {
		_, _ = authz.AddPermissionForRole(e, "ADMINISTRADOR", authz.ObjFicha, perm)
	}
	for _, perm := range authz.PermisosAprendiz {
		_, _ = authz.AddPermissionForRole(e, "ADMINISTRADOR", authz.ObjAprendiz, perm)
	}
	for _, perm := range authz.PermisosInstructor {
		_, _ = authz.AddPermissionForRole(e, "ADMINISTRADOR", authz.ObjInstructor, perm)
	}
	for _, perm := range authz.PermisosAsistencia {
		_, _ = authz.AddPermissionForRole(e, "ADMINISTRADOR", authz.ObjAsistencia, perm)
	}
	for _, perm := range authz.PermisosUsuario {
		_, _ = authz.AddPermissionForRole(e, "ADMINISTRADOR", authz.ObjUsuario, perm)
	}
	// Inventario desactivado: no addInventarioToRole

	// COORDINADOR: mismo que administrador (sin inventario)
	for _, perm := range authz.PermisosPersona {
		_, _ = authz.AddPermissionForRole(e, "COORDINADOR", authz.ObjPersona, perm)
	}
	for _, perm := range authz.PermisosPrograma {
		_, _ = authz.AddPermissionForRole(e, "COORDINADOR", authz.ObjPrograma, perm)
	}
	for _, perm := range authz.PermisosFicha {
		_, _ = authz.AddPermissionForRole(e, "COORDINADOR", authz.ObjFicha, perm)
	}
	for _, perm := range authz.PermisosAprendiz {
		_, _ = authz.AddPermissionForRole(e, "COORDINADOR", authz.ObjAprendiz, perm)
	}
	for _, perm := range authz.PermisosInstructor {
		_, _ = authz.AddPermissionForRole(e, "COORDINADOR", authz.ObjInstructor, perm)
	}
	for _, perm := range authz.PermisosAsistencia {
		_, _ = authz.AddPermissionForRole(e, "COORDINADOR", authz.ObjAsistencia, perm)
	}
	// Inventario desactivado: no addInventarioToRole

	// INSTRUCTOR: solo asistencia
	_, _ = authz.RemoveFilteredPolicyForRole(e, "INSTRUCTOR", authz.ObjPersona)
	for _, perm := range authz.PermisosAsistencia {
		_, _ = authz.AddPermissionForRole(e, "INSTRUCTOR", authz.ObjAsistencia, perm)
	}

	// APRENDIZ, VISITANTE, ASPIRANTE, PROVEEDOR: solo VER PERSONA (perfil)
	for _, roleName := range []string{"APRENDIZ", "VISITANTE", "ASPIRANTE", "PROVEEDOR"} {
		_, _ = authz.AddPermissionForRole(e, roleName, authz.ObjPersona, "VER PERSONA")
	}

	_ = e.SavePolicy()
	log.Println("RolePermissionSeeder completado.")
	return nil
}

// SyncInventarioPermissionsToRoles: inventario desactivado, no hace nada.
func SyncInventarioPermissionsToRoles(db *gorm.DB) error {
	log.Println("Inventario desactivado: SyncInventarioPermissionsToRoles omitido.")
	return nil
}
