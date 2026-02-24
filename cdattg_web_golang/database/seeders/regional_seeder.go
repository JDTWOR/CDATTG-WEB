package seeders

import (
	"log"

	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

// RunRegionalSeeder crea la regional GUAVIARE (igual que cdattg_web).
func RunRegionalSeeder(db *gorm.DB) error {
	log.Println("Ejecutando RegionalSeeder...")
	r := models.Regional{
		Nombre: "GUAVIARE",
		Codigo: "GUAV",
	}
	if err := db.Where("nombre = ?", r.Nombre).FirstOrCreate(&r).Error; err != nil {
		return err
	}
	log.Println("RegionalSeeder completado.")
	return nil
}
