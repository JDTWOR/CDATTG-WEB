/**
 * database: AutoMigrate de tablas del portal y semilleros.
 * @author Cristian Deysdayr Jiménez
 */
package database

import (
	"log"

	"github.com/sena/cdattg-web-golang/models"
)

// patchAutoMigratePortalModels crea o verifica tablas del portal público.
func patchAutoMigratePortalModels() error {
	if err := DB.AutoMigrate(
		&models.PortalBanner{},
		&models.PortalPresentacion{},
		&models.Semillero{},
		&models.SemilleroLinea{},
		&models.SemilleroIntegrante{},
		&models.SemilleroProyecto{},
		&models.BiogjgasBanner{},
		&models.BiogjgasRevista{},
		&models.BiogjgasBoletin{},
		&models.BiogjgasPodcast{},
		&models.BiogjgasConvocatoria{},
		&models.BiogjgasActividad{},
	); err != nil {
		return err
	}
	log.Println("Esquema: tablas de portal y semillero verificadas")
	return nil
}
