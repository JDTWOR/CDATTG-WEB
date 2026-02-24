package seeders

import (
	"log"

	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

// Departamentos Colombia (ids y nombres como cdattg_web DepartamentoSeeder).
var departamentosSeed = []struct {
	ID     uint
	Nombre string
	PaisID uint
}{
	{5, "ANTIOQUIA", 1}, {8, "ATLÁNTICO", 1}, {11, "BOGOTÁ, D.C.", 1}, {13, "BOLÍVAR", 1},
	{15, "BOYACÁ", 1}, {17, "CALDAS", 1}, {18, "CAQUETÁ", 1}, {19, "CAUCA", 1}, {20, "CESAR", 1},
	{23, "CÓRDOBA", 1}, {25, "CUNDINAMARCA", 1}, {27, "CHOCÓ", 1}, {41, "HUILA", 1},
	{44, "LA GUAJIRA", 1}, {47, "MAGDALENA", 1}, {50, "META", 1}, {52, "NARIÑO", 1},
	{54, "NORTE DE SANTANDER", 1}, {63, "QUINDIO", 1}, {66, "RISARALDA", 1}, {68, "SANTANDER", 1},
	{70, "SUCRE", 1}, {73, "TOLIMA", 1}, {76, "VALLE DEL CAUCA", 1}, {81, "ARAUCA", 1},
	{85, "CASANARE", 1}, {86, "PUTUMAYO", 1}, {88, "ARCHIPIÉLAGO DE SAN ANDRÉS, PROVIDENCIA Y SANTA CATALINA", 1},
	{91, "AMAZONAS", 1}, {94, "GUAINÍA", 1}, {95, "GUAVIARE", 1}, {97, "VAUPÉS", 1}, {99, "VICHADA", 1},
}

func RunDepartamentoSeeder(db *gorm.DB) error {
	log.Println("Ejecutando DepartamentoSeeder...")
	for _, d := range departamentosSeed {
		var dep models.Departamento
		if err := db.Where("id = ?", d.ID).First(&dep).Error; err == gorm.ErrRecordNotFound {
			dep = models.Departamento{}
			dep.ID = d.ID
			dep.Nombre = d.Nombre
			dep.PaisID = &d.PaisID
			if err := db.Create(&dep).Error; err != nil {
				return err
			}
		} else if err != nil {
			return err
		}
	}
	log.Println("DepartamentoSeeder completado.")
	return nil
}
