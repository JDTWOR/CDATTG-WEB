package seeders

import (
	"errors"
	"log"

	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

const sedeNombreAmbienteExternoSanJose = "AMBIENTE EXTERNO SAN JOSE"

// Bloques por nombre de sede (cdattg_web BloqueSeeder).
var bloquesSeed = []struct {
	Nombre       string
	SedeNombre   string
}{
	{"CENTRO", "CENTRO"},
	{"BIODIVERSA", "BIODIVERSA KM11"},
	{"B1", "MODELO"}, {"B2", "MODELO"}, {"B3", "MODELO"}, {"B5", "MODELO"}, {"B6", "MODELO"},
	{"JOAQUIN PARIS", sedeNombreAmbienteExternoSanJose}, {"CARPINTERIA CENTRO DE CONVENIOS", sedeNombreAmbienteExternoSanJose},
	{"PANADERIA CHARRAS", sedeNombreAmbienteExternoSanJose}, {"COLINAS", sedeNombreAmbienteExternoSanJose}, {"GENERICO", sedeNombreAmbienteExternoSanJose},
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
		err := db.Where("nombre = ?", b.SedeNombre).First(&sede).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				continue
			}
			return err
		}
		bloque := models.Bloque{Nombre: b.Nombre, SedeID: sede.ID}
		if err := db.Where("sede_id = ? AND nombre = ?", sede.ID, b.Nombre).FirstOrCreate(&bloque).Error; err != nil {
			return err
		}
	}
	log.Println("BloqueSeeder completado.")
	return nil
}
