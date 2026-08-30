/**
 * seeders: permiso GESTIONAR SEMILLERO para admin y coordinador.
 * @author Cristian Deysdayr Jiménez
 */
package seeders

import (
	"log"

	casbin "github.com/casbin/casbin/v3"
	"github.com/sena/cdattg-web-golang/authz"
	"gorm.io/gorm"
)

// seedSemilleroPermissions asigna el CRUD del portal a administración.
func seedSemilleroPermissions(e *casbin.Enforcer) error {
	for _, role := range []string{"SUPER ADMINISTRADOR", "ADMINISTRADOR", "COORDINADOR"} {
		if err := addPermissionsForObject(e, role, authz.ObjSemillero, authz.PermisosSemillero); err != nil {
			return err
		}
	}
	return nil
}

// SyncSemilleroPermissionsToRoles idempotente para despliegues existentes.
func SyncSemilleroPermissionsToRoles(db *gorm.DB) error {
	log.Println("Sincronizando permisos de semillero...")
	e, err := authz.GetEnforcer(db)
	if err != nil {
		return err
	}
	if err := seedSemilleroPermissions(e); err != nil {
		return err
	}
	return e.SavePolicy()
}
