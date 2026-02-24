package seeders

import (
	"log"

	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

// Sedes basadas en cdattg_web SedeSeeder (campo sede -> Nombre en Go).
var sedesSeed = []struct {
	Nombre    string
	Direccion string
	RegionalID uint
}{
	{"CENTRO", "Cra 24 no. 7", 1},
	{"MODELO", "Cra 19c no. 16-48", 1},
	{"BIODIVERSA KM11", "KM 11 RUTA 65", 1},
	{"AMBIENTE EXTERNO SAN JOSE", "BATLLON JOAQUIN PARIS", 1},
	{"AMBIENTE EXTERNO CALAMAR", "CALAMAR", 1},
	{"AMBIENTE EXTERNO EL RETORNO", "EL RETORNO", 1},
	{"AMBIENTE EXTERNO MIRAFLORES", "MIRAFLORES", 1},
	{"AMBIENTE EXTERNO MAPIRIPAN", "MAPIRIPAN", 1},
	{"AMBIENTE EXTERNO PUERTO CONCORDIA", "PUERTO CONCORDIA", 1},
}

// RunSedeSeeder crea las sedes (igual que cdattg_web SedeSeeder).
func RunSedeSeeder(db *gorm.DB) error {
	log.Println("Ejecutando SedeSeeder...")
	for _, s := range sedesSeed {
		regionalID := s.RegionalID
		if regionalID == 0 {
			regionalID = 1
		}
		sede := models.Sede{
			Nombre:     s.Nombre,
			Direccion:  s.Direccion,
			RegionalID: &regionalID,
			Status:     true,
		}
		if err := db.Where("nombre = ?", s.Nombre).FirstOrCreate(&sede).Error; err != nil {
			return err
		}
	}
	log.Println("SedeSeeder completado.")
	return nil
}
