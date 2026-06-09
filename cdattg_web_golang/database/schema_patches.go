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

	// Normalizar horarios guardados como ISO (evita desfases en el cronograma).
	if err := DB.Exec(`
		UPDATE ficha_dias_formacion
		SET hora_inicio = (regexp_match(hora_inicio, 'T(\d{2}:\d{2})'))[1]
		WHERE hora_inicio ~ 'T\d{2}:\d{2}'
	`).Error; err != nil {
		return err
	}
	if err := DB.Exec(`
		UPDATE ficha_dias_formacion
		SET hora_fin = (regexp_match(hora_fin, 'T(\d{2}:\d{2})'))[1]
		WHERE hora_fin ~ 'T\d{2}:\d{2}'
	`).Error; err != nil {
		return err
	}
	if err := DB.Exec(`
		UPDATE ficha_dias_formacion
		SET hora_inicio = ''
		WHERE hora_inicio IS NOT NULL AND hora_inicio <> '' AND hora_inicio !~ '^\d{2}:\d{2}(:|$)'
	`).Error; err != nil {
		return err
	}
	if err := DB.Exec(`
		UPDATE ficha_dias_formacion
		SET hora_fin = ''
		WHERE hora_fin IS NOT NULL AND hora_fin <> '' AND hora_fin !~ '^\d{2}:\d{2}(:|$)'
	`).Error; err != nil {
		return err
	}
	log.Println("Esquema: horarios ficha_dias_formacion normalizados a HH:MM")

	return nil
}
