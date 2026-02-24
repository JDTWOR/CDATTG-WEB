package seeders

import (
	"log"

	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

var jornadasNombres = []string{"MAÑANA", "TARDE", "NOCHE", "FINES DE SEMANA"}

func RunJornadasSeeder(db *gorm.DB) error {
	log.Println("Ejecutando JornadasSeeder...")
	for _, nom := range jornadasNombres {
		j := models.Jornada{Nombre: nom}
		_ = db.Where("nombre = ?", nom).FirstOrCreate(&j).Error
	}
	log.Println("JornadasSeeder completado.")
	return nil
}
