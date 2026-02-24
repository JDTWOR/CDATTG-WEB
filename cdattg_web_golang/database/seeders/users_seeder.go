package seeders

import (
	"log"
	"strconv"

	"github.com/sena/cdattg-web-golang/authz"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/utils"
	"gorm.io/gorm"
)

// UserSeed define un usuario de prueba (igual que cdattg_web UsersSeeder).
type UserSeed struct {
	Email     string
	Password  string
	PersonaID uint
	Role      string
}

var userSeeds = []UserSeed{
	{"info@dataguaviare.com.co", "Guaviare25.", 1, "BOT"},
	{"superadmin@dataguaviare.com", "Guaviare25.", 2, "SUPER ADMINISTRADOR"},
	{"admin@dataguaviare.com", "Guaviare25.", 3, "ADMINISTRADOR"},
	{"coordinador@dataguaviare.com", "Guaviare25.", 4, "COORDINADOR"},
	{"instructor@dataguaviare.com", "Guaviare25.", 5, "INSTRUCTOR"},
	{"aprendiz1@dataguaviare.com", "Guaviare25!", 6, "APRENDIZ"},
	{"aprendiz2@dataguaviare.com", "Guaviare25!", 7, "APRENDIZ"},
	{"proveedor@dataguaviare.com", "Guaviare25.", 8, "PROVEEDOR"},
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

		personaID := u.PersonaID
		user := models.User{
			Email:     u.Email,
			Password:  hash,
			Status:    true,
			PersonaID: &personaID,
		}

		var existing models.User
		if err := db.Where("email = ?", u.Email).First(&existing).Error; err == nil {
			existing.Password = hash
			existing.Status = true
			existing.PersonaID = &personaID
			if err := db.Save(&existing).Error; err != nil {
				return err
			}
			user = existing
		} else {
			if err := db.Create(&user).Error; err != nil {
				return err
			}
		}

		// Asignar rol en Casbin (única fuente de verdad)
		sub := strconv.FormatUint(uint64(user.ID), 10)
		if _, err := authz.AddRoleForUser(e, sub, u.Role); err != nil {
			// Evitar duplicado: eliminar y volver a añadir, o ignorar si ya existe
			_ = e.SavePolicy()
		}
	}

	_ = e.SavePolicy()
	log.Println("UsersSeeder completado.")
	return nil
}
