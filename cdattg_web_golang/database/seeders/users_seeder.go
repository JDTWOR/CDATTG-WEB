package seeders

import (
	"errors"
	"fmt"
	"log"
	"strconv"

	casbin "github.com/casbin/casbin/v3"
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

// exclusiveSeedRoles: cuentas de módulo; no deben acumular APRENDIZ/INSTRUCTOR por sync de matrícula.
var exclusiveSeedRoles = map[string]struct{}{
	"FPI":                   {},
	"VIGILANTE":             {},
	"BIENESTAR AL APRENDIZ": {},
	"BIBLIOTECARIO":         {},
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
	// Usuario solo módulo FPI (Sofía Fase 1/2 y Betowa)
	{"formacionprofesionalintegralcomplementaria@dataguaviare.com.co", seedPasswordDefault, 9100, "FPI"},
	// Usuario módulo vigilancia (portería / accesos)
	{"vigilanciasena@dataguaviare.com.co", seedPasswordDefault, 9101, "VIGILANTE"},
	{"biblioteca@dataguaviare.com.co", seedPasswordDefault, 9200, "BIBLIOTECARIO"},
}

func isExclusiveSeedRole(role string) bool {
	_, ok := exclusiveSeedRoles[role]
	return ok
}

// skipExclusiveModuleUser evita que sync de aprendiz/instructor sume roles a cuentas de módulo.
func skipExclusiveModuleUser(e *casbin.Enforcer, sub string) bool {
	roles, err := authz.GetRolesForUser(e, sub)
	if err != nil {
		return false
	}
	for _, r := range roles {
		if isExclusiveSeedRole(r) {
			return true
		}
	}
	return false
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
		if isExclusiveSeedRole(u.Role) {
			// Quita APRENDIZ/INSTRUCTOR u otros roles heredados de persona reciclada.
			if _, err := authz.DeleteRolesForUser(e, sub); err != nil {
				return fmt.Errorf("casbin DeleteRolesForUser(user=%s): %w", sub, err)
			}
		}
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

// EnforceExclusiveSeedRoles deja solo el rol de módulo en cuentas seed exclusivas
// (llamar después de SyncAprendiz/SyncInstructor para no recontaminar).
func EnforceExclusiveSeedRoles(db *gorm.DB) error {
	e, err := authz.GetEnforcer(db)
	if err != nil {
		return err
	}
	for _, u := range userSeeds {
		if !isExclusiveSeedRole(u.Role) {
			continue
		}
		var user models.User
		if err := db.Where("email = ?", u.Email).First(&user).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				continue
			}
			return err
		}
		sub := strconv.FormatUint(uint64(user.ID), 10)
		if _, err := authz.DeleteRolesForUser(e, sub); err != nil {
			return err
		}
		if _, err := authz.AddRoleForUser(e, sub, u.Role); err != nil {
			return err
		}
	}
	return e.SavePolicy()
}
