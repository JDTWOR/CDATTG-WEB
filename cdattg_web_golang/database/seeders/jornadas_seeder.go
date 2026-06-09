package seeders

import (
	"log"

	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

var jornadasNombres = []string{"DIURNA", "TARDE", "NOCHE", "FINES DE SEMANA", "JORNADA CONTINUA"}

var jornadaExtensionFin = map[string]int{
	"DIURNA":           60,
	"TARDE":            60,
	"NOCHE":            60,
	"FINES DE SEMANA":  30,
	"JORNADA CONTINUA": 60,
}

func RunJornadasSeeder(db *gorm.DB) error {
	log.Println("Ejecutando JornadasSeeder...")
	for _, nom := range jornadasNombres {
		j := models.Jornada{Nombre: nom}
		if ext, ok := jornadaExtensionFin[nom]; ok {
			j.MinutosExtensionFin = &ext
		}
		if err := db.Where("nombre = ?", nom).FirstOrCreate(&j).Error; err != nil {
			return err
		}
	}
	log.Println("JornadasSeeder completado.")
	return nil
}
