package seeders

import (
	"log"

	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

// Bloques por nombre de sede (cdattg_web BloqueSeeder).
var bloquesSeed = []struct {
	Nombre    string
	SedeNombre string
}{
	{"CENTRO", "CENTRO"},
	{"BIODIVERSA", "BIODIVERSA KM11"},
	{"B1", "MODELO"}, {"B2", "MODELO"}, {"B3", "MODELO"}, {"B5", "MODELO"}, {"B6", "MODELO"},
	{"JOAQUIN PARIS", "AMBIENTE EXTERNO SAN JOSE"}, {"CARPINTERIA CENTRO DE CONVENIOS", "AMBIENTE EXTERNO SAN JOSE"},
	{"PANADERIA CHARRAS", "AMBIENTE EXTERNO SAN JOSE"}, {"COLINAS", "AMBIENTE EXTERNO SAN JOSE"}, {"GENERICO", "AMBIENTE EXTERNO SAN JOSE"},
	{"CALAMAR", "AMBIENTE EXTERNO CALAMAR"},
	{"VEREDA CHAPARRAL", "AMBIENTE EXTERNO EL RETORNO"}, {"EL RETORNO", "AMBIENTE EXTERNO EL RETORNO"},
	{"MIRAFLORES", "AMBIENTE EXTERNO MIRAFLORES"},
	{"MAPIRIPAN", "AMBIENTE EXTERNO MAPIRIPAN"},
	{"PUERTO CONCORDIA", "AMBIENTE EXTERNO PUERTO CONCORDIA"},
}

// RunBloqueSeeder crea los bloques (igual que cdattg_web BloqueSeeder).
func RunBloqueSeeder(db *gorm.DB) error {
	log.Println("Ejecutando BloqueSeeder...")
	var sede models.Sede
	for _, b := range bloquesSeed {
		if err := db.Where("nombre = ?", b.SedeNombre).First(&sede).Error; err != nil {
			continue
		}
		bloque := models.Bloque{Nombre: b.Nombre, SedeID: sede.ID}
		_ = db.Where("sede_id = ? AND nombre = ?", sede.ID, b.Nombre).FirstOrCreate(&bloque).Error
	}
	log.Println("BloqueSeeder completado.")
	return nil
}
