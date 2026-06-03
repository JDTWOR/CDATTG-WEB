package database

import "log"

// EnsureSchemaPatches aplica cambios incrementales de esquema sin ejecutar Migrate() completo.
func EnsureSchemaPatches() error {
	if DB == nil {
		return nil
	}
	if err := DB.Exec(`
		ALTER TABLE aprendices
		ADD COLUMN IF NOT EXISTS oculto_en_asistencia BOOLEAN NOT NULL DEFAULT false
	`).Error; err != nil {
		return err
	}
	log.Println("Esquema: columna aprendices.oculto_en_asistencia verificada")
	return nil
}
