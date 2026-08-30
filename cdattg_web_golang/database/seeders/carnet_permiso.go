/**
 * Dejo el permiso del carnet digital en el rol aprendiz.
 * Lo corro al arrancar para bases que ya existían.
 *
 * @author Cristian Deysdayr Jiménez
 */
package seeders

import (
	"log"

	"github.com/sena/cdattg-web-golang/authz"
	"gorm.io/gorm"
)

// SyncCarnetDigitalPermission asigna VER CARNET DIGITAL al aprendiz (idempotente).
func SyncCarnetDigitalPermission(db *gorm.DB) error {
	log.Println("Sincronizando permiso de carnet digital...")
	e, err := authz.GetEnforcer(db)
	if err != nil {
		return err
	}
	if _, err := authz.AddPermissionForRole(e, "APRENDIZ", authz.ObjCarnet, authz.ActVerCarnetDigital); err != nil {
		return err
	}
	if _, err := authz.AddPermissionForRole(e, "INSTRUCTOR", authz.ObjCarnet, authz.ActValidarCarnetDigital); err != nil {
		return err
	}
	if _, err := authz.AddPermissionForRole(e, "INSTRUCTOR", authz.ObjPersona, authz.ActEditarMiPersona); err != nil {
		return err
	}
	if err := seedBibliotecarioPermissions(e); err != nil {
		return err
	}
	if err := asignarRolBibliotecario(db, e); err != nil {
		return err
	}
	return e.SavePolicy()
}
