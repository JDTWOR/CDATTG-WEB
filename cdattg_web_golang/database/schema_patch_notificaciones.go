/**
 * El submódulo de reposición física avisa por notificaciones, pero la tabla
 * notificaciones solo se migraba cuando el módulo inventario estaba activo.
 * Este patch crea (o actualiza) esa tabla sola, sin tocar el resto del
 * inventario que sigue desactivado en producción.
 *
 * @author Cristian Deysdayr Jiménez
 */
package database

import (
	"log"

	"github.com/sena/cdattg-web-golang/models/inventario"
)

// patchAutoMigrateNotificaciones deja lista la tabla notificaciones
// para la campana del usuario y los avisos de pérdida de carnet.
func patchAutoMigrateNotificaciones() error {
	if err := DB.AutoMigrate(&inventario.Notificacion{}); err != nil {
		return err
	}
	log.Println("Esquema: tabla notificaciones verificada")
	return nil
}
