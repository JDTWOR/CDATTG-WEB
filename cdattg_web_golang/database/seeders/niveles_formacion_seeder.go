package seeders

import (
	"log"

	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

var nivelesFormacionNombres = []string{
	"TÉCNICO", "TECNÓLOGO", "OPERARIO", "AUXILIAR",
	"ESPECIALIZACIÓN TECNOLÓGICA", "PROFUNDIZACIÓN TÉCNICA",
	"COMPLEMENTARIA VIRTUAL", "CURSO ESPECIAL",
}

func RunNivelesFormacionSeeder(db *gorm.DB) error {
	log.Println("Ejecutando NivelesFormacionSeeder...")
	for _, nom := range nivelesFormacionNombres {
		n := models.NivelFormacion{Nombre: nom, Status: true}
		_ = db.Where("nombre = ?", nom).FirstOrCreate(&n).Error
	}
	log.Println("NivelesFormacionSeeder completado.")
	return nil
}
