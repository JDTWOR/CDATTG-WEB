package database

import "github.com/sena/cdattg-web-golang/models"

// patchAutoMigratePersonaCambioPendiente deja lista la tabla persona_cambios_pendientes.
func patchAutoMigratePersonaCambioPendiente() error {
	if err := DB.AutoMigrate(&models.PersonaCambioPendiente{}); err != nil {
		return err
	}
	return nil
}
