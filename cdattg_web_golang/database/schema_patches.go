package database

import (
	"log"

	"github.com/sena/cdattg-web-golang/models"
)

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
		UPDATE ficha_dias_formacion
		SET jornada_id = jb.jornada_id
		FROM jornada_bloques jb, fichas_caracterizacion fc
		WHERE fc.id = ficha_dias_formacion.ficha_id
		  AND ficha_dias_formacion.jornada_id IS NULL
		  AND ficha_dias_formacion.deleted_at IS NULL
		  AND fc.jornada_id = jb.jornada_id
		  AND ficha_dias_formacion.dia_formacion_id = jb.dia_formacion_id
		  AND LEFT(TRIM(ficha_dias_formacion.hora_inicio), 5) = jb.hora_inicio
		  AND LEFT(TRIM(ficha_dias_formacion.hora_fin), 5) = jb.hora_fin
	`).Error; err != nil {
		return err
	}
	log.Println("Esquema: jornada_id inferido en ficha_dias_formacion legacy")

	// DIURNA legacy tenía hora_inicio 03:00 (desfase histórico); alinear a 06:30–13:00.
	if err := DB.Exec(`
		UPDATE jornadas
		SET hora_inicio = '06:30', hora_fin = COALESCE(NULLIF(TRIM(hora_fin), ''), '13:00')
		WHERE TRIM(hora_inicio) IN ('03:00', '3:00')
	`).Error; err != nil {
		return err
	}
	log.Println("Esquema: jornadas con hora_inicio 03:00 corregidas")

	// Plantilla DIURNA legacy (id=1) sin bloques: crear lun–vie 06:30–13:00.
	if err := DB.Exec(`
		INSERT INTO jornada_bloques (created_at, updated_at, jornada_id, dia_formacion_id, hora_inicio, hora_fin, orden)
		SELECT NOW(), NOW(), 1, d.dia, '06:30', '13:00', 0
		FROM (VALUES (1), (2), (3), (4), (5)) AS d(dia)
		WHERE EXISTS (SELECT 1 FROM jornadas WHERE id = 1)
		  AND NOT EXISTS (SELECT 1 FROM jornada_bloques WHERE jornada_id = 1)
	`).Error; err != nil {
		return err
	}
	log.Println("Esquema: plantilla jornada DIURNA id=1 verificada")

	// Rellenar bloques ficha sin hora desde plantilla jornada_bloques.
	if err := DB.Exec(`
		UPDATE ficha_dias_formacion fd
		SET hora_inicio = jb.hora_inicio,
		    hora_fin = jb.hora_fin,
		    jornada_id = jb.jornada_id
		FROM fichas_caracterizacion fc, jornada_bloques jb
		WHERE fc.id = fd.ficha_id
		  AND fc.jornada_id = jb.jornada_id
		  AND fd.dia_formacion_id = jb.dia_formacion_id
		  AND fd.deleted_at IS NULL
		  AND (fd.hora_inicio IS NULL OR TRIM(fd.hora_inicio) = '')
		  AND (fd.hora_fin IS NULL OR TRIM(fd.hora_fin) = '')
	`).Error; err != nil {
		return err
	}
	log.Println("Esquema: ficha_dias_formacion sin hora rellenados desde plantilla")

	// Sincronizar cabecera jornadas desde el primer bloque de plantilla cuando falta o está desfasada.
	if err := DB.Exec(`
		UPDATE jornadas j
		SET hora_inicio = sub.hi, hora_fin = sub.hf
		FROM (
			SELECT DISTINCT ON (jornada_id) jornada_id, hora_inicio AS hi, hora_fin AS hf
			FROM jornada_bloques
			ORDER BY jornada_id, orden, id
		) sub
		WHERE j.id = sub.jornada_id
		  AND (
		    TRIM(COALESCE(j.hora_inicio, '')) = ''
		    OR TRIM(j.hora_inicio) IN ('03:00', '3:00')
		  )
	`).Error; err != nil {
		return err
	}
	log.Println("Esquema: cabecera jornadas sincronizada con plantilla")

	// Renombrar MAÑANA → DIURNA si aplica
	if err := DB.Exec(`
		UPDATE jornadas SET nombre = 'DIURNA' WHERE nombre = 'MAÑANA'
	`).Error; err != nil {
		return err
	}

	if err := DB.AutoMigrate(
		&models.InstructorFichaTrasladoFecha{},
		&models.DiaFestivo{},
		&models.DiaSinFormacionSede{},
		&models.ConfiguracionAsistencia{},
	); err != nil {
		return err
	}
	log.Println("Esquema: instructor_ficha_traslado_fechas, dias_festivos, dias_sin_formacion_sede y configuracion_asistencia verificados")

	if err := DB.Exec(`
		INSERT INTO configuracion_asistencia (id, plazo_edicion_observaciones_dias, intervalo_auto_cierre_minutos, minutos_alerta_sin_sesion, minutos_extension_default)
		VALUES (1, 5, 5, 90, 60)
		ON CONFLICT (id) DO NOTHING
	`).Error; err != nil {
		return err
	}
	log.Println("Esquema: fila por defecto configuracion_asistencia verificada")

	return nil
}
