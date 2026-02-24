package seeders

import (
	"log"

	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

// RunPaisSeeder crea el país Colombia (id 1, igual que cdattg_web).
func RunPaisSeeder(db *gorm.DB) error {
	log.Println("Ejecutando PaisSeeder...")
	pais := models.Pais{}
	if err := db.Where("id = ?", 1).First(&pais).Error; err == gorm.ErrRecordNotFound {
		pais = models.Pais{}
		pais.ID = 1
		pais.Nombre = "COLOMBIA"
		if err := db.Create(&pais).Error; err != nil {
			return err
		}
	} else if err != nil {
		return err
	}
	log.Println("PaisSeeder completado.")
	return nil
}
