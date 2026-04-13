package seeders

import (
	"errors"
	"fmt"
	"log"
	"strconv"

	"github.com/sena/cdattg-web-golang/authz"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/utils"
	"gorm.io/gorm"
)

const (
	seedPasswordDefault  = "Guaviare25."
	seedPasswordAprendiz = "Guaviare25!"
)

// UserSeed define un usuario de prueba (igual que cdattg_web UsersSeeder).
type UserSeed struct {
	Email     string
	Password  string
	PersonaID uint
	Role      string
}

var userSeeds = []UserSeed{
	{"info@dataguaviare.com.co", seedPasswordDefault, 1, "BOT"},
	{"superadmin@dataguaviare.com.co", seedPasswordDefault, 2, "SUPER ADMINISTRADOR"},
	{"admin@dataguaviare.com.co", seedPasswordDefault, 3, "ADMINISTRADOR"},
	{"coordinador@dataguaviare.com.co", seedPasswordDefault, 4, "COORDINADOR"},
	{"instructor@dataguaviare.com.co", seedPasswordDefault, 5, "INSTRUCTOR"},
	{"aprendiz1@dataguaviare.com.co", seedPasswordAprendiz, 6, "APRENDIZ"},
	{"aprendiz2@dataguaviare.com.co", seedPasswordAprendiz, 7, "APRENDIZ"},
	{"proveedor@dataguaviare.com.co", seedPasswordDefault, 8, "PROVEEDOR"},
	// Usuario para oficina de bienestar al aprendiz (solo lectura de dashboards)
	{"bienestar@dataguaviare.com.co", seedPasswordDefault, 9, "BIENESTAR AL APRENDIZ"},
}

// upsertSeedUser crea o actualiza el usuario por email y devuelve el registro persistido (con ID).
func upsertSeedUser(db *gorm.DB, u UserSeed, hash string) (models.User, error) {
	personaID := u.PersonaID
	user := models.User{
		Email:     u.Email,
		Password:  hash,
		Status:    true,
		PersonaID: &personaID,
	}
	var existing models.User
	err := db.Where("email = ?", u.Email).First(&existing).Error
	if err == nil {
		existing.Password = hash
		existing.Status = true
		existing.PersonaID = &personaID
		if err := db.Save(&existing).Error; err != nil {
			return models.User{}, err
		}
		return existing, nil
	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		if err := db.Create(&user).Error; err != nil {
			return models.User{}, err
		}
		return user, nil
	}
	return models.User{}, err
}

// RunUsersSeeder crea usuarios de prueba y asigna roles (igual que cdattg_web UsersSeeder).
func RunUsersSeeder(db *gorm.DB) error {
	log.Println("Ejecutando UsersSeeder...")

	e, err := authz.GetEnforcer(db)
	if err != nil {
		return err
	}

	for _, u := range userSeeds {
		hash, err := utils.HashPassword(u.Password)
		if err != nil {
			return err
		}

		user, err := upsertSeedUser(db, u, hash)
		if err != nil {
			return err
		}

		sub := strconv.FormatUint(uint64(user.ID), 10)
		if _, err := authz.AddRoleForUser(e, sub, u.Role); err != nil {
			return fmt.Errorf("casbin AddRoleForUser(user=%s, role=%s): %w", sub, u.Role, err)
		}
	}

	if err := e.SavePolicy(); err != nil {
		return err
	}
	log.Println("UsersSeeder completado.")
	return nil
}
