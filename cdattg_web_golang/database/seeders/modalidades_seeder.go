package seeders

import (
	"log"

	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

var modalidadesNombres = []string{"PRESENCIAL", "VIRTUAL", "A DISTANCIA"}

func RunModalidadesSeeder(db *gorm.DB) error {
	log.Println("Ejecutando ModalidadesSeeder...")
	for _, nom := range modalidadesNombres {
		m := models.Modalidad{Nombre: nom}
		_ = db.Where("nombre = ?", nom).FirstOrCreate(&m).Error
	}
	log.Println("ModalidadesSeeder completado.")
	return nil
}
