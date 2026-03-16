package seeders

import (
	"log"

	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

var tiposObservacionAsistencia = []struct {
	Codigo string
	Nombre string
}{
	{"NO_UNIFORME", "No trajo uniforme"},
	{"INASISTENCIA_JUSTIFICADA", "Inasistencia justificada"},
	{"ABANDONO_FORMACION", "Abandono de formación"},
	{"RETARDO", "Retardo"},
	{"OTRO", "Otro"},
}

func RunTiposObservacionAsistenciaSeeder(db *gorm.DB) error {
	log.Println("Ejecutando TiposObservacionAsistenciaSeeder...")
	for _, t := range tiposObservacionAsistencia {
		rec := models.TipoObservacionAsistencia{Codigo: t.Codigo, Nombre: t.Nombre, Activo: true}
		if err := db.Where("codigo = ?", t.Codigo).FirstOrCreate(&rec).Error; err != nil {
			return err
		}
		if rec.Nombre != t.Nombre {
			_ = db.Model(&models.TipoObservacionAsistencia{}).Where("codigo = ?", t.Codigo).Update("nombre", t.Nombre).Error
		}
	}
	log.Println("TiposObservacionAsistenciaSeeder completado.")
	return nil
}
