package seeders

import (
	"log"

	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

// Días de formación (cdattg_web ParametroSeeder dias + DOMINGO).
var diasSeed = []struct {
	Nombre string
	Codigo string
}{
	{"LUNES", "LUN"},
	{"MARTES", "MAR"},
	{"MIÉRCOLES", "MIE"},
	{"JUEVES", "JUE"},
	{"VIERNES", "VIE"},
	{"SÁBADO", "SAB"},
	{"DOMINGO", "DOM"},
}

// RunDiasFormacionSeeder crea los días de formación para fichas.
func RunDiasFormacionSeeder(db *gorm.DB) error {
	log.Println("Ejecutando DiasFormacionSeeder...")
	for _, d := range diasSeed {
		dia := models.DiasFormacion{Nombre: d.Nombre, Codigo: d.Codigo, Status: true}
		if err := db.Where("nombre = ?", d.Nombre).FirstOrCreate(&dia).Error; err != nil {
			return err
		}
	}
	log.Println("DiasFormacionSeeder completado.")
	return nil
}
