package seeders

import (
	"log"
	"time"

	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

// PersonaSeed define datos de una persona de prueba (igual que cdattg_web PersonaSeeder).
type PersonaSeed struct {
	ID             uint
	NumeroDocumento string
	PrimerNombre   string
	SegundoNombre  string
	PrimerApellido string
	SegundoApellido string
	Celular        string
	Email          string
	Direccion      string
	FechaNac       string
}

var personaSeeds = []PersonaSeed{
	{1, "111111111", "BOT", "", "AUTOMATICO", "", "3001111111", "bot@dataguaviare.com", "CALLE 11 #11-11", "2000-01-01"},
	{2, "987654321", "SUPER", "", "ADMINISTRADOR", "", "3000000000", "superadmin@dataguaviare.com", "CALLE 10 #10-10", "1980-01-01"},
	{3, "654321123", "ADMINISTRADOR", "DEMO", "CDATTG", "ADMIN", "3010000000", "admin@dataguaviare.com", "CARRERA 8 #12-34", "1990-06-15"},
	{4, "555125555", "COORDINADOR", "DEMO", "CDATTG", "PRUEBAS", "3021255555", "coordinador@dataguaviare.com", "CALLE 12 #13-56", "1985-04-10"},
	{5, "555555555", "INSTRUCTOR", "DEMO", "CDATTG", "PRUEBAS", "3025555555", "instructor@dataguaviare.com", "CALLE 12 #13-56", "1985-04-10"},
	{6, "444444444", "APRENDIZ", "UNO", "CDATTG", "PRUEBAS", "3034444444", "aprendiz1@dataguaviare.com", "AVENIDA 5 #22-10", "2002-03-20"},
	{7, "333333333", "APRENDIZ", "DOS", "CDATTG", "PRUEBAS", "3043333333", "aprendiz2@dataguaviare.com", "AVENIDA 6 #18-20", "2003-07-05"},
	{8, "222222222", "PROVEEDOR", "DEMO", "CDATTG", "PRUEBAS", "3052222222", "proveedor@dataguaviare.com", "CALLE 7 #14-25", "1988-05-15"},
}

// RunPersonaSeeder crea las personas de prueba (IDs 1-8) igual que cdattg_web.
func RunPersonaSeeder(db *gorm.DB) error {
	log.Println("Ejecutando PersonaSeeder...")
	for _, s := range personaSeeds {
		t, _ := time.Parse("2006-01-02", s.FechaNac)
		persona := models.Persona{
			UserAuditModel:   models.UserAuditModel{BaseModel: models.BaseModel{ID: s.ID}},
			NumeroDocumento:  s.NumeroDocumento,
			PrimerNombre:     s.PrimerNombre,
			SegundoNombre:    s.SegundoNombre,
			PrimerApellido:  s.PrimerApellido,
			SegundoApellido: s.SegundoApellido,
			Celular:         s.Celular,
			Email:           s.Email,
			Direccion:       s.Direccion,
			Status:          true,
			FechaNacimiento: &t,
		}
		if err := db.Save(&persona).Error; err != nil {
			return err
		}
	}
	// Resetear la secuencia de PostgreSQL para que el próximo ID sea 9
	if err := db.Exec("SELECT setval('personas_id_seq', (SELECT MAX(id) FROM personas))").Error; err != nil {
		log.Printf("Advertencia: No se pudo resetear la secuencia de personas: %v", err)
	}
	log.Println("PersonaSeeder completado.")
	return nil
}
