package seeders

import (
	"log"

	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

type jornadaBloqueSeed struct {
	DiaID  uint
	Inicio string
	Fin    string
	Orden  int
}

// Bloques por nombre de jornada (1=lun … 7=dom).
var jornadaBloquesSeed = map[string][]jornadaBloqueSeed{
	"DIURNA": {
		{1, "06:30", "13:00", 0}, {2, "06:30", "13:00", 0}, {3, "06:30", "13:00", 0},
		{4, "06:30", "13:00", 0}, {5, "06:30", "13:00", 0},
	},
	"TARDE": {
		{1, "13:00", "18:00", 0}, {2, "13:00", "18:00", 0}, {3, "13:00", "18:00", 0},
		{4, "13:00", "18:00", 0}, {5, "13:00", "18:00", 0},
	},
	"NOCHE": {
		{1, "18:00", "23:00", 0}, {2, "18:00", "23:00", 0}, {3, "18:00", "23:00", 0},
		{4, "18:00", "23:00", 0}, {5, "18:00", "23:00", 0},
	},
	"JORNADA CONTINUA": {
		{1, "06:00", "18:00", 0}, {2, "06:00", "18:00", 0}, {3, "06:00", "18:00", 0},
		{4, "06:00", "18:00", 0}, {5, "06:00", "18:00", 0},
	},
	"FINES DE SEMANA": {
		{5, "08:00", "12:00", 1}, {5, "14:00", "18:00", 2},
		{6, "08:00", "12:00", 1}, {6, "14:00", "18:00", 2},
		{7, "08:00", "12:00", 1}, {7, "14:00", "18:00", 2},
	},
}

func RunJornadaBloquesSeeder(db *gorm.DB) error {
	log.Println("Ejecutando JornadaBloquesSeeder...")
	for nombre, bloques := range jornadaBloquesSeed {
		var j models.Jornada
		if err := db.Where("nombre = ?", nombre).First(&j).Error; err != nil {
			log.Printf("JornadaBloquesSeeder: jornada %q no encontrada, omitiendo", nombre)
			continue
		}
		var count int64
		if err := db.Model(&models.JornadaBloque{}).Where("jornada_id = ?", j.ID).Count(&count).Error; err != nil {
			return err
		}
		if count > 0 {
			continue
		}
		for _, b := range bloques {
			rec := models.JornadaBloque{
				JornadaID:      j.ID,
				DiaFormacionID: b.DiaID,
				HoraInicio:     b.Inicio,
				HoraFin:        b.Fin,
				Orden:          b.Orden,
			}
			if err := db.Create(&rec).Error; err != nil {
				return err
			}
		}
	}
	log.Println("JornadaBloquesSeeder completado.")
	return nil
}
