/**
 * Dejo los permisos del submódulo de pérdida de carnet en sus roles.
 * El aprendiz solo solicita y ve su historial; el bibliotecario y el super
 * administrador validan. Lo corro al arrancar sin romper lo existente.
 *
 * @author Cristian Deysdayr Jiménez
 */
package seeders

import (
	"log"

	"github.com/sena/cdattg-web-golang/authz"
	"gorm.io/gorm"
)

// SyncCarnetPerdidaPermission asigna los permisos de reposición física.
func SyncCarnetPerdidaPermission(db *gorm.DB) error {
	log.Println("Sincronizando permisos de carnet por pérdida...")
	e, err := authz.GetEnforcer(db)
	if err != nil {
		return err
	}
	if _, err := authz.AddPermissionForRole(e, "APRENDIZ", authz.ObjCarnet, authz.ActSolicitarCarnetPerdida); err != nil {
		return err
	}
	for _, rol := range []string{authz.RolBibliotecario, "SUPER ADMINISTRADOR"} {
		if _, err := authz.AddPermissionForRole(e, rol, authz.ObjCarnet, authz.ActValidarCarnetPerdida); err != nil {
			return err
		}
	}
	return e.SavePolicy()
}
