package seeders

import (
	"log"
	"strconv"

	"github.com/sena/cdattg-web-golang/authz"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

// RunSyncAprendizRolesSeeder asigna el rol APRENDIZ en Casbin a usuarios con matrícula activa en aprendices.
func RunSyncAprendizRolesSeeder(db *gorm.DB) error {
	log.Println("Ejecutando SyncAprendizRolesSeeder...")

	var personaIDs []uint
	if err := db.Model(&models.Aprendiz{}).
		Where("estado = ? AND deleted_at IS NULL", true).
		Distinct("persona_id").
		Pluck("persona_id", &personaIDs).Error; err != nil {
		return err
	}
	if len(personaIDs) == 0 {
		return nil
	}

	e, err := authz.GetEnforcer(db)
	if err != nil {
		return err
	}

	var users []models.User
	if err := db.Where("persona_id IN ?", personaIDs).Find(&users).Error; err != nil {
		return err
	}

	for _, user := range users {
		if user.PersonaID == nil {
			continue
		}
		sub := strconv.FormatUint(uint64(user.ID), 10)
		_, _ = authz.AddRoleForUser(e, sub, "APRENDIZ")
	}
	_ = e.SavePolicy()
	log.Println("SyncAprendizRolesSeeder completado.")
	return nil
}
