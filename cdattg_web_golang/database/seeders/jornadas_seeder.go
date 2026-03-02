package seeders

import (
	"log"

	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

var jornadasNombres = []string{"MAÑANA", "TARDE", "NOCHE", "FINES DE SEMANA", "JORNADA CONTINUA"}

// Horarios oficiales (hora_fin a veces se extiende en la práctica; ver minutos_extension_fin)
var jornadaHorarios = map[string]struct{ inicio, fin string }{
	"MAÑANA":          {"06:30", "13:00"}, // 1 PM oficial; a veces la clase termina a las 2 PM
	"TARDE":           {"13:00", "18:10"},
	"NOCHE":           {"17:50", "23:10"},
	"FINES DE SEMANA": {"06:00", "18:00"},
	"JORNADA CONTINUA": {"06:30", "18:00"}, // Mañana y tarde (ej. Enfermería)
}

// Minutos después de hora_fin en que aún se permite registrar salida (clase a veces se extiende)
var jornadaExtensionFin = map[string]int{
	"MAÑANA":          60,
	"TARDE":           60,
	"NOCHE":           60,
	"FINES DE SEMANA": 30,
	"JORNADA CONTINUA": 60,
}

func RunJornadasSeeder(db *gorm.DB) error {
	log.Println("Ejecutando JornadasSeeder...")
	for _, nom := range jornadasNombres {
		j := models.Jornada{Nombre: nom}
		if h, ok := jornadaHorarios[nom]; ok {
			j.HoraInicio = h.inicio
			j.HoraFin = h.fin
		}
		if ext, ok := jornadaExtensionFin[nom]; ok {
			j.MinutosExtensionFin = &ext
		}
		if err := db.Where("nombre = ?", nom).FirstOrCreate(&j).Error; err != nil {
			return err
		}
		// Actualizar horarios y extensión por si se cambiaron los defaults (re-ejecución del seeder)
		upd := map[string]interface{}{}
		if h, ok := jornadaHorarios[nom]; ok {
			upd["hora_inicio"] = h.inicio
			upd["hora_fin"] = h.fin
		}
		if ext, ok := jornadaExtensionFin[nom]; ok {
			upd["minutos_extension_fin"] = ext
		}
		if len(upd) > 0 {
			_ = db.Model(&models.Jornada{}).Where("nombre = ?", nom).Updates(upd).Error
		}
	}
	log.Println("JornadasSeeder completado.")
	return nil
}
