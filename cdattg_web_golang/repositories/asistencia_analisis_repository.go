package repositories

import (
	"time"

	"github.com/sena/cdattg-web-golang/database"
	"gorm.io/gorm"
)

// SesionDetalleRow sesión de asistencia con fecha y primera hora (fuente única bloques A y B).
type SesionDetalleRow struct {
	AsistenciaID   uint       `gorm:"column:asistencia_id"`
	FichaID        uint       `gorm:"column:ficha_id"`
	FichaNumero    string     `gorm:"column:ficha_numero"`
	ProgramaNombre string     `gorm:"column:programa_nombre"`
	JornadaNombre  string     `gorm:"column:jornada_nombre"`
	Fecha          time.Time  `gorm:"column:fecha"`
	PrimeraHora    *time.Time `gorm:"column:primera_hora"`
}

type AsistenciaAnalisisRepository interface {
	FindSesionesDetalle(desde, hasta time.Time, sedeIDs []uint, fichaID, aprendizID *uint, jornada string) ([]SesionDetalleRow, error)
	FindFechasConSesionPorFicha(fichaID uint, desde, hasta time.Time) (map[string]struct{}, error)
	CountAprendicesAsistieronEnSesiones(asistenciaIDs []uint, aprendizID *uint) (int, error)
	FindAsistenciaIDsEnRango(desde, hasta time.Time, sedeIDs []uint, jornada string, soloFichasActivas bool) ([]uint, error)
}

type asistenciaAnalisisRepository struct {
	db *gorm.DB
}

func NewAsistenciaAnalisisRepository() AsistenciaAnalisisRepository {
	return &asistenciaAnalisisRepository{db: database.GetDB()}
}

func (r *asistenciaAnalisisRepository) baseJoin(q *gorm.DB) *gorm.DB {
	return q.Table("asistencias a").
		Joins("INNER JOIN instructor_fichas_caracterizacion ifc ON a.instructor_ficha_id = ifc.id").
		Joins("INNER JOIN fichas_caracterizacion fc ON ifc.ficha_id = fc.id AND fc.deleted_at IS NULL").
		Joins("LEFT JOIN jornadas j ON fc.jornada_id = j.id").
		Joins("LEFT JOIN programas_formacion pf ON fc.programa_formacion_id = pf.id")
}

func (r *asistenciaAnalisisRepository) applySedeFilter(q *gorm.DB, sedeIDs []uint) *gorm.DB {
	if len(sedeIDs) == 0 {
		return q
	}
	return q.Where("fc.sede_id IN ?", sedeIDs)
}

func (r *asistenciaAnalisisRepository) applyActivasFilter(q *gorm.DB, soloActivas bool, ref time.Time) *gorm.DB {
	if !soloActivas {
		return q
	}
	refStr := ref.Format(time.DateOnly)
	return q.Where("fc.status = ? AND (fc.fecha_fin IS NULL OR fc.fecha_fin >= ?)", true, refStr)
}

func (r *asistenciaAnalisisRepository) FindSesionesDetalle(
	desde, hasta time.Time,
	sedeIDs []uint,
	fichaID, aprendizID *uint,
	jornada string,
) ([]SesionDetalleRow, error) {
	q := r.baseJoin(r.db).
		Select(`
			a.id AS asistencia_id,
			fc.id AS ficha_id,
			fc.ficha AS ficha_numero,
			COALESCE(pf.nombre, '') AS programa_nombre,
			COALESCE(j.nombre, '') AS jornada_nombre,
			a.fecha AS fecha,
			COALESCE(
				(SELECT MIN(aa.hora_ingreso) FROM asistencia_aprendices aa
				 WHERE aa.asistencia_id = a.id AND aa.deleted_at IS NULL AND aa.hora_ingreso IS NOT NULL),
				a.hora_inicio,
				a.created_at
			) AS primera_hora`).
		Where("a.deleted_at IS NULL AND a.fecha >= ? AND a.fecha < ?", desde, hasta)
	q = r.applySedeFilter(q, sedeIDs)
	if fichaID != nil && *fichaID > 0 {
		q = q.Where("fc.id = ?", *fichaID)
	}
	if jornada != "" {
		q = q.Where("j.nombre = ?", jornada)
	}
	if aprendizID != nil && *aprendizID > 0 {
		q = q.Where(`EXISTS (
			SELECT 1 FROM asistencia_aprendices aa2
			INNER JOIN aprendices ap ON ap.id = aa2.aprendiz_ficha_id AND ap.deleted_at IS NULL
			WHERE aa2.asistencia_id = a.id AND aa2.deleted_at IS NULL AND ap.id = ?
		)`, *aprendizID)
	}
	var rows []SesionDetalleRow
	if err := q.Find(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

func (r *asistenciaAnalisisRepository) FindFechasConSesionPorFicha(fichaID uint, desde, hasta time.Time) (map[string]struct{}, error) {
	var fechas []time.Time
	err := r.baseJoin(r.db).
		Select("DISTINCT a.fecha").
		Where("a.deleted_at IS NULL AND fc.id = ? AND a.fecha >= ? AND a.fecha < ?", fichaID, desde, hasta).
		Pluck("fecha", &fechas).Error
	if err != nil {
		return nil, err
	}
	loc := fechasLoc()
	out := make(map[string]struct{}, len(fechas))
	for _, t := range fechas {
		out[t.In(loc).Format(time.DateOnly)] = struct{}{}
	}
	return out, nil
}

func fechasLoc() *time.Location {
	loc, err := time.LoadLocation("America/Bogota")
	if err != nil {
		return time.Local
	}
	return loc
}

func (r *asistenciaAnalisisRepository) CountAprendicesAsistieronEnSesiones(asistenciaIDs []uint, aprendizID *uint) (int, error) {
	if len(asistenciaIDs) == 0 {
		return 0, nil
	}
	q := r.db.Table("asistencia_aprendices aa").
		Where("aa.deleted_at IS NULL AND aa.asistencia_id IN ? AND aa.hora_ingreso IS NOT NULL", asistenciaIDs)
	if aprendizID != nil && *aprendizID > 0 {
		q = q.Where("aa.aprendiz_ficha_id = ?", *aprendizID)
	}
	var total int64
	if err := q.Distinct("aa.aprendiz_ficha_id").Count(&total).Error; err != nil {
		return 0, err
	}
	return int(total), nil
}

func (r *asistenciaAnalisisRepository) FindAsistenciaIDsEnRango(
	desde, hasta time.Time,
	sedeIDs []uint,
	jornada string,
	soloFichasActivas bool,
) ([]uint, error) {
	ref := hasta.Add(-time.Second)
	q := r.baseJoin(r.db).Select("a.id").
		Where("a.deleted_at IS NULL AND a.fecha >= ? AND a.fecha < ?", desde, hasta)
	q = r.applySedeFilter(q, sedeIDs)
	q = r.applyActivasFilter(q, soloFichasActivas, ref)
	if jornada != "" {
		q = q.Where("j.nombre = ?", jornada)
	}
	var ids []uint
	if err := q.Pluck("a.id", &ids).Error; err != nil {
		return nil, err
	}
	return ids, nil
}
