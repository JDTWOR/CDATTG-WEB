package seeders

import (
	"log"

	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

var generosNombres = []string{"MASCULINO", "FEMENINO", "NO DEFINE"}

func RunGenerosSeeder(db *gorm.DB) error {
	log.Println("Ejecutando GenerosSeeder...")
	for _, nom := range generosNombres {
		g := models.Genero{Nombre: nom}
		_ = db.Where("nombre = ?", nom).FirstOrCreate(&g).Error
	}
	log.Println("GenerosSeeder completado.")
	return nil
}
