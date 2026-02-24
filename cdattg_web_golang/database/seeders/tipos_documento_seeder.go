package seeders

import (
	"log"

	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

var tiposDocumentoNombres = []string{
	"CÉDULA DE CIUDADANÍA", "CÉDULA DE EXTRANJERÍA", "PASAPORTE",
	"TARJETA DE IDENTIDAD", "REGISTRO CIVIL", "SIN IDENTIFICACIÓN",
}

func RunTiposDocumentoSeeder(db *gorm.DB) error {
	log.Println("Ejecutando TiposDocumentoSeeder...")
	for _, nom := range tiposDocumentoNombres {
		t := models.TipoDocumento{Nombre: nom}
		_ = db.Where("nombre = ?", nom).FirstOrCreate(&t).Error
	}
	log.Println("TiposDocumentoSeeder completado.")
	return nil
}
