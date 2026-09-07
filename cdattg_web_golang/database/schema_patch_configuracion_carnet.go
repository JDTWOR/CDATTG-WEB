/**
 * Creo la tabla de configuración del carnet al arrancar.
 * Patrón singleton: una sola fila (id=1) con los datos del reverso.
 *
 * @author Cristian Deysdayr Jiménez
 */
package database

import (
	"log"

	"github.com/sena/cdattg-web-golang/models"
)

// patchAutoMigrateConfiguracionCarnet deja lista la tabla configuracion_carnets.
func patchAutoMigrateConfiguracionCarnet() error {
	if err := DB.AutoMigrate(&models.ConfiguracionCarnet{}); err != nil {
		return err
	}
	// Inserto fila por defecto si no existe.
	var count int64
	DB.Model(&models.ConfiguracionCarnet{}).Count(&count)
	if count == 0 {
		DB.Create(&models.ConfiguracionCarnet{ID: 1})
	}
	log.Println("Esquema: tabla configuracion_carnets verificada")
	return nil
}
