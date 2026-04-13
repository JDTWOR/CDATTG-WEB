package seeders

import (
	"log"

	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

// Municipios subset (Guaviare 95 y Meta 50 como en cdattg_web).
var municipiosSeed = []struct {
	Nombre        string
	DepartamentoID uint
}{
	{"EL RETORNO", 95}, {"CALAMAR", 95}, {"MIRAFLORES", 95}, {"SAN JOSÉ DEL GUAVIARE", 95},
	{"MAPIRIPAN", 50}, {"PUERTO CONCORDIA", 50}, {"ACACÍAS", 50},
}

func RunMunicipioSeeder(db *gorm.DB) error {
	log.Println("Ejecutando MunicipioSeeder...")
	for _, m := range municipiosSeed {
		var mun models.Municipio
		deptID := m.DepartamentoID
		if err := db.Where("nombre = ? AND departamento_id = ?", m.Nombre, deptID).First(&mun).Error; err == gorm.ErrRecordNotFound {
			mun = models.Municipio{Nombre: m.Nombre, DepartamentoID: &deptID}
			if err := db.Create(&mun).Error; err != nil {
				return err
			}
		} else if err != nil {
			return err
		}
	}
	log.Println("MunicipioSeeder completado.")
	return nil
}
