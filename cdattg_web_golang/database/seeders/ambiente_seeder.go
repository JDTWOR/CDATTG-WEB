package seeders

import (
	"log"

	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

// Ambientes: nombre y piso identificado por (bloque, piso) para resolver PisoID.
var ambientesSeed = []struct {
	Nombre       string
	BloqueNombre string
	PisoNombre   string
}{
	{"CENTRO-AUDITORIO", "CENTRO", "P1"}, {"CENTRO-CANCHA", "CENTRO", "P1"}, {"CENTRO-P1-A1-FARMACIA", "CENTRO", "P1"}, {"CENTRO-P1-A2-PELUQUERIA", "CENTRO", "P1"}, {"CENTRO-P1-A3-COSMETOLOGIA", "CENTRO", "P1"},
	{"CENTRO-P2-A1-MUSICA", "CENTRO", "P2"}, {"CENTRO-P2-A2-ENFERMERIA", "CENTRO", "P2"}, {"CENTRO-P2-A3-REDES", "CENTRO", "P2"},
	{"BIODIVERSA KM11-AMBIENTE PRACTICAS", "BIODIVERSA", "P1"},
	{"AULA_MOVIL", "B1", "P1"}, {"MODELO-B1-AUDITORIO", "B1", "P1"},
	{"MODELO-B2-P1-A1", "B2", "P1"}, {"MODELO-B2-P1-A2", "B2", "P1"}, {"MODELO-B2-P1-A3-MODISTERIA", "B2", "P1"},
	{"MODELO-B2-P2-A1", "B2", "P2"}, {"MODELO-B2-P2-A2", "B2", "P2"},
	{"MODELO-B2-P3-A1", "B2", "P3"}, {"MODELO-B2-P3-A2", "B2", "P3"},
	{"MODELO-B3-P1-BIBLIOTECA", "B3", "P1"}, {"MODELO-B3-P1-TALLER CONSTRUCCIÓN", "B3", "P1"},
	{"MODELO-B3-P2-LAB BIORREMEDIACIÓN", "B3", "P2"}, {"MODELO-B3-P2-LAB BIOTECNOLOGÍA", "B3", "P2"},
	{"MODELO-B3-P3-DESARROLLO DE SISTEMAS", "B3", "P3"}, {"MODELO-B3-P3-MULTIMEDIA", "B3", "P3"},
	{"MODELO-B5-TALLER AGROINDUSTRIA", "B5", "P1"},
	{"MODELO-B6-COLISEO", "B6", "P1"},
	{"EXTERNO - BATALLON JOAQUIN PARIS", "JOAQUIN PARIS", "JOAQUIN PARIS"}, {"EXTERNO - GENERICO", "GENERICO", "GENERICO"},
	{"EXTERNO - CALAMAR", "CALAMAR", "P1"}, {"EXTERNO - RETORNO", "EL RETORNO", "P1"}, {"EXTERNO - MIRAFLORES", "MIRAFLORES", "P1"}, {"EXTERNO - MAPIRIPAN", "MAPIRIPAN", "P1"}, {"EXTERNO - PUERTO CONCORDIA", "PUERTO CONCORDIA", "P1"},
}

// RunAmbienteSeeder crea ambientes (igual que cdattg_web AmbienteSeeder, subset).
func RunAmbienteSeeder(db *gorm.DB) error {
	log.Println("Ejecutando AmbienteSeeder...")
	for _, a := range ambientesSeed {
		var bloque models.Bloque
		if err := db.Where("nombre = ?", a.BloqueNombre).First(&bloque).Error; err != nil {
			continue
		}
		var piso models.Piso
		if err := db.Where("bloque_id = ? AND nombre = ?", bloque.ID, a.PisoNombre).First(&piso).Error; err != nil {
			continue
		}
		amb := models.Ambiente{Nombre: a.Nombre, PisoID: piso.ID, Status: true}
		_ = db.Where("piso_id = ? AND nombre = ?", piso.ID, a.Nombre).FirstOrCreate(&amb).Error
	}
	log.Println("AmbienteSeeder completado.")
	return nil
}
