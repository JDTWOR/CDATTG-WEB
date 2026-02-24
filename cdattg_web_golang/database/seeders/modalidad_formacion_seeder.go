package seeders

import (
	"log"

	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

// Modalidades de formación (cdattg_web ParametroSeeder modalidades -> tabla modalidades_formacion en Go).
var modalidadesSeed = []struct {
	Nombre string
	Codigo string
}{
	{"PRESENCIAL", "PRES"},
	{"VIRTUAL", "VIRT"},
	{"A DISTANCIA", "DIST"},
}

// RunModalidadFormacionSeeder crea las modalidades de formación.
func RunModalidadFormacionSeeder(db *gorm.DB) error {
	log.Println("Ejecutando ModalidadFormacionSeeder...")
	for _, m := range modalidadesSeed {
		mod := models.ModalidadFormacion{Nombre: m.Nombre, Codigo: m.Codigo, Status: true}
		if err := db.Where("nombre = ?", m.Nombre).FirstOrCreate(&mod).Error; err != nil {
			return err
		}
	}
	log.Println("ModalidadFormacionSeeder completado.")
	return nil
}
