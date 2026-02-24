package seeders

import (
	"log"

	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

// Pisos por bloque (cdattg_web PisoSeeder). BloqueNombre identifica el bloque.
var pisosSeed = []struct {
	Nombre        string
	BloqueNombre  string
}{
	{"P1", "CENTRO"}, {"P2", "CENTRO"},
	{"P1", "BIODIVERSA"},
	{"P1", "B1"},
	{"P1", "B2"}, {"P2", "B2"}, {"P3", "B2"},
	{"P1", "B3"}, {"P2", "B3"}, {"P3", "B3"},
	{"P1", "B5"}, {"P1", "B6"},
	{"JOAQUIN PARIS", "JOAQUIN PARIS"}, {"CARPINTERIA CENTRO DE CONVENIOS", "CARPINTERIA CENTRO DE CONVENIOS"}, {"PANADERIA CHARRAS", "PANADERIA CHARRAS"}, {"COLINAS", "COLINAS"}, {"GENERICO", "GENERICO"},
	{"P1", "CALAMAR"}, {"P1", "VEREDA CHAPARRAL"}, {"P1", "EL RETORNO"}, {"P1", "MIRAFLORES"}, {"P1", "MAPIRIPAN"}, {"P1", "PUERTO CONCORDIA"},
}

// RunPisoSeeder crea los pisos (igual que cdattg_web PisoSeeder).
func RunPisoSeeder(db *gorm.DB) error {
	log.Println("Ejecutando PisoSeeder...")
	var bloque models.Bloque
	for _, p := range pisosSeed {
		if err := db.Where("nombre = ?", p.BloqueNombre).First(&bloque).Error; err != nil {
			continue
		}
		piso := models.Piso{Nombre: p.Nombre, BloqueID: bloque.ID}
		_ = db.Where("bloque_id = ? AND nombre = ?", bloque.ID, p.Nombre).FirstOrCreate(&piso).Error
	}
	log.Println("PisoSeeder completado.")
	return nil
}
