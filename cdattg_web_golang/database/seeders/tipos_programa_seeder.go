package seeders

import (
	"log"

	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

var tiposProgramaNombres = []string{
	"TITULADA", "COMPLEMENTARIA",
}

func RunTiposProgramaSeeder(db *gorm.DB) error {
	log.Println("Ejecutando TiposProgramaSeeder...")
	for _, nom := range tiposProgramaNombres {
		t := models.TipoPrograma{Nombre: nom, Status: true}
		_ = db.Where("nombre = ?", nom).FirstOrCreate(&t).Error
	}
	log.Println("TiposProgramaSeeder completado.")
	return nil
}
