/**
 * Creo la tabla de solicitudes de carnet al arrancar.
 * Lo hice porque el arranque no corre Migrate() completo y la lista del instructor reventaba.
 * Lo usa EnsureSchemaPatches junto con el modelo CarnetSolicitud.
 *
 * @author Cristian Deysdayr Jiménez
 */
package database

import (
	"log"

	"github.com/sena/cdattg-web-golang/models"
)

// patchAutoMigrateCarnetSolicitud deja lista la tabla carnet_solicitudes.
func patchAutoMigrateCarnetSolicitud() error {
	if err := DB.AutoMigrate(&models.CarnetSolicitud{}); err != nil {
		return err
	}
	log.Println("Esquema: tabla carnet_solicitudes verificada")
	return nil
}
