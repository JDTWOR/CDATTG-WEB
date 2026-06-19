package services

import (
	"strconv"

	"github.com/sena/cdattg-web-golang/authz"
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/repositories"
)

const rolAprendizCasbin = "APRENDIZ"

// EnsureAprendizRoleForPersona asigna el rol APRENDIZ en Casbin al usuario vinculado a la persona, si existe.
func EnsureAprendizRoleForPersona(personaID uint) error {
	userRepo := repositories.NewUserRepository()
	user, err := userRepo.FindByPersonaID(personaID)
	if err != nil || user == nil {
		return nil
	}
	db := database.GetDB()
	e, err := authz.GetEnforcer(db)
	if err != nil {
		return err
	}
	sub := strconv.FormatUint(uint64(user.ID), 10)
	if _, err := authz.AddRoleForUser(e, sub, rolAprendizCasbin); err != nil {
		return err
	}
	return e.SavePolicy()
}
