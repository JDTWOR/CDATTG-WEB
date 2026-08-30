/**
 * Dejo el rol bibliotecario con permiso de solo ver carnets regulares.
 * Lo corro al arrancar para bases que ya existían.
 *
 * @author Cristian Deysdayr Jiménez
 */
package seeders

import (
	"errors"
	"strconv"

	casbin "github.com/casbin/casbin/v3"
	"github.com/sena/cdattg-web-golang/authz"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

const correoBibliotecaSeed = "biblioteca@dataguaviare.com.co"

// seedBibliotecarioPermissions da ver carnet de biblioteca y su propia persona.
func seedBibliotecarioPermissions(e *casbin.Enforcer) error {
	if _, err := authz.AddPermissionForRole(e, authz.RolBibliotecario, authz.ObjCarnet, authz.ActVerCarnetBiblioteca); err != nil {
		return err
	}
	return seedVerPersonaForRoles(e, []string{authz.RolBibliotecario})
}

// asignarRolBibliotecario pone el rol en el usuario de biblioteca.
func asignarRolBibliotecario(db *gorm.DB, e *casbin.Enforcer) error {
	var user models.User
	err := db.Where("email = ?", correoBibliotecaSeed).First(&user).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil
	}
	if err != nil {
		return err
	}
	sub := strconv.FormatUint(uint64(user.ID), 10)
	_, err = authz.AddRoleForUser(e, sub, authz.RolBibliotecario)
	return err
}
