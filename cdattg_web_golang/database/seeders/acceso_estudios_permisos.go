/**
 * Permisos de los perfiles que administran la formación del CDATTG:
 * MEDIA TECNICA y FORMACION COMPLEMENTARIA.
 * Ambos crean/editan fichas, programas, aprendices e instructores, consultan
 * asistencia (no toman), y acceden a bienestar e infraestructura.
 * @author Cristian Deysdayr Jiménez
 */
package seeders

import (
	"log"

	casbin "github.com/casbin/casbin/v3"
	"github.com/sena/cdattg-web-golang/authz"
	"gorm.io/gorm"
)

// rolesAccesoEstudios devuelve los roles que administran la formación.
func rolesAccesoEstudios() []string {
	return []string{authz.RolMediaTecnica, authz.RolFormacionComplementaria}
}

// seedAccesoEstudiosPermissions asigna los permisos de formación a ambos roles.
func seedAccesoEstudiosPermissions(e *casbin.Enforcer) error {
	for _, rol := range rolesAccesoEstudios() {
		if err := addPermissionsForObject(e, rol, authz.ObjPrograma, authz.PermisosPrograma); err != nil {
			return err
		}
		if err := addPermissionsForObject(e, rol, authz.ObjFicha, authz.PermisosFicha); err != nil {
			return err
		}
		if err := addPermissionsForObject(e, rol, authz.ObjAprendiz, authz.PermisosAprendiz); err != nil {
			return err
		}
		if err := addPermissionsForObject(e, rol, authz.ObjInstructor, authz.PermisosInstructor); err != nil {
			return err
		}
		if err := addPermissionsForObject(e, rol, authz.ObjPersona, authz.PermisosPersona); err != nil {
			return err
		}
		if err := addPermissionsForObject(e, rol, authz.ObjAsistencia, []string{"VER ASISTENCIA"}); err != nil {
			return err
		}
	}
	return nil
}

// SyncAccesoEstudiosRoles aplica los permisos de forma idempotente al arrancar.
func SyncAccesoEstudiosRoles(db *gorm.DB) error {
	log.Println("Sincronizando permisos de MEDIA TECNICA y FORMACION COMPLEMENTARIA...")
	e, err := authz.GetEnforcer(db)
	if err != nil {
		return err
	}
	if err := seedAccesoEstudiosPermissions(e); err != nil {
		return err
	}
	return e.SavePolicy()
}
