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

	if err := DB.Exec(`
		ALTER TABLE ficha_dias_formacion
		ADD COLUMN IF NOT EXISTS orden INTEGER NOT NULL DEFAULT 0
	`).Error; err != nil {
		return err
	}
	if err := DB.Exec(`
		ALTER TABLE ficha_dias_formacion
		ADD COLUMN IF NOT EXISTS jornada_id BIGINT REFERENCES jornadas(id)
	`).Error; err != nil {
		return err
	}
	log.Println("Esquema: ficha_dias_formacion orden/jornada_id verificados")

	// Vincular bloques legacy a plantilla cuando coinciden día+hora y la ficha tiene esa jornada principal.
	if err := DB.Exec(`
		UPDATE ficha_dias_formacion fd
		SET jornada_id = jb.jornada_id
		FROM jornada_bloques jb
		INNER JOIN fichas_caracterizacion fc ON fc.id = fd.ficha_id
		WHERE fd.jornada_id IS NULL
		  AND fd.deleted_at IS NULL
		  AND fc.jornada_id = jb.jornada_id
		  AND fd.dia_formacion_id = jb.dia_formacion_id
		  AND LEFT(TRIM(fd.hora_inicio), 5) = jb.hora_inicio
		  AND LEFT(TRIM(fd.hora_fin), 5) = jb.hora_fin
	`).Error; err != nil {
		return err
	}
	log.Println("Esquema: jornada_id inferido en ficha_dias_formacion legacy")

	// Renombrar MAÑANA → DIURNA si aplica
	if err := DB.Exec(`
		UPDATE jornadas SET nombre = 'DIURNA' WHERE nombre = 'MAÑANA'
	`).Error; err != nil {
		return err
	}

	return nil
}
