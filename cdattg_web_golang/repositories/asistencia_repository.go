package repositories

import (
	"errors"
	"strings"
	"time"

	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

const (
	asistPreloadInstructorFichaFicha        = "InstructorFicha.Ficha"
	asistPreloadInstructorFichaFichaJornada = "InstructorFicha.Ficha.Jornada"
	asistPreloadAAAprendizPersona           = "AsistenciaAprendices.Aprendiz.Persona"
	asistCondFichaID                        = "ficha_id = ?"
	asistSQLFilterSedeFicha                 = " AND fc.sede_id = ?"
	// Sesiones abiertas/cerradas sin ningún aprendiz en asistencia_aprendices (ruido operativo).
	asistSQLSoloSesionesConAprendices = `
  AND EXISTS (
    SELECT 1 FROM asistencia_aprendices aa_sesion WHERE aa_sesion.asistencia_id = a.id
  )`
	// Coherente con ListAsistenciasEfectivasEnSesiones / historial de asistencia.
	asistSQLAsistioEfectivo = `aa.hora_ingreso IS NOT NULL
    AND (aa.estado IS NULL OR aa.estado = '' OR aa.estado = 'ASISTENCIA_COMPLETA' OR aa.estado = 'ASISTENCIA_PARCIAL')`
)

type AsistenciaRepository interface {
	Create(a *models.Asistencia) error
	FindByID(id uint) (*models.Asistencia, error)
	FindByInstructorFichaID(instructorFichaID uint) ([]models.Asistencia, error)
	FindActivaByInstructorFichaID(instructorFichaID uint) (*models.Asistencia, error)
	FindByInstructorFichaIDAndFecha(instructorFichaID uint, fecha time.Time) (*models.Asistencia, error)
	FindActivaByFichaID(fichaID uint) (*models.Asistencia, error)
	FindByFichaIDAndFechas(fichaID uint, fechaInicio, fechaFin string) ([]models.Asistencia, error)
	FindIDsByFichaIDAndFecha(fichaID uint, fecha string) ([]uint, error)
	Update(a *models.Asistencia) error
	GetDashboardResumen(sedeID *uint, fecha string) (totalAprendices int, porFicha []DashboardFichaRow, err error)
	// GetFichasSinSesionHoy lista fichas activas (no eliminadas) sin ninguna sesión de asistencia en la fecha dada.
	GetFichasSinSesionHoy(sedeID *uint, fecha string) ([]DashboardFichaSinSesionRow, error)
	CountPendientesRevisionByFecha(sedeID *uint, fecha string) (int, error)
	ListSesionesCasosBienestarEnRango(sedeID *uint, fechaInicio, fechaFin string) ([]SesionCasosBienestarRaw, error)
	ListAprendicesActivosCasosBienestar(sedeID *uint) ([]AprendizCasosBienestarRaw, error)
	ListAsistenciasEfectivasEnSesiones(asistenciaIDs []uint) ([]AsistenciaEfectivaRaw, error)
	ListDetalleSesionesCasosBienestar(fichaNumero string, aprendizID uint, fechaInicio, fechaFin string, sedeNombre string) ([]DetalleSesionCasosBienestarRaw, error)
	FindSesionesNoFinalizadasDesde(fechaDesde string) ([]models.Asistencia, error)
	GetPendientesRevisionPorInstructor(sedeID *uint, fechaInicio, fechaFin string) ([]PendienteInstructorRow, error)
}

// CasosBienestarRow una fila para el reporte de casos de bienestar (aprendices con N+ inasistencias)
type CasosBienestarRow struct {
	AprendizID           uint
	PersonaNombre        string
	NumeroDocumento      string
	FichaNumero          string
	ProgramaNombre       string
	SedeNombre           string
	JornadaNombre        string
	InstructorNombre     string
	AmbienteNombre       string
	ModalidadNombre      string
	TotalSesiones        int
	AsistenciasEfectivas int
	Inasistencias        int
}

// PendienteInstructorRow una fila del resumen de pendientes de revisión por instructor
type PendienteInstructorRow struct {
	InstructorID                uint
	InstructorNombre            string
	NumeroDocumento             string
	CantidadAprendicesSinSalida int
}

type InasistenciaDetalleRow struct {
	Fecha            string
	InstructorNombre string
	Observaciones    string
	MotivoExclusion  string
}

// SesionCasosBienestarRaw sesión de asistencia en rango para cálculo de bienestar.
type SesionCasosBienestarRaw struct {
	AsistenciaID uint
	FichaID      uint
	InstructorID uint
	SedeID       uint
	Fecha        time.Time
}

// AprendizCasosBienestarRaw aprendiz activo con metadatos de ficha.
type AprendizCasosBienestarRaw struct {
	AprendizID      uint
	FichaID         uint
	FichaNumero     string
	PersonaNombre   string
	NumeroDocumento string
	ProgramaNombre  string
	SedeNombre      string
	JornadaNombre   string
	InstructorNombre string
	AmbienteNombre  string
	ModalidadNombre string
}

// AsistenciaEfectivaRaw asistencia efectiva de un aprendiz en una sesión.
type AsistenciaEfectivaRaw struct {
	AprendizID     uint
	AsistenciaID   uint
	Observaciones  string
}

// DetalleSesionCasosBienestarRaw sesión con datos para detalle por aprendiz.
type DetalleSesionCasosBienestarRaw struct {
	AsistenciaID     uint
	FichaID          uint
	InstructorID     uint
	SedeID           uint
	Fecha            time.Time
	InstructorNombre string
	AsistioEfectivo  bool
	Observaciones    string
}

// DashboardFichaRow una fila del resumen por ficha para el dashboard
type DashboardFichaRow struct {
	FichaID              uint
	FichaNumero          string
	ProgramaNombre       string
	JornadaNombre        string
	SedeNombre           string
	CantidadVinieron     int // asistencia efectiva en el día (con ingreso registrado)
	CantidadEnFormacion  int // aún sin salida (en formación ahora)
	TotalAprendices      int
}

// DashboardFichaSinSesionRow ficha sin ninguna asistencia registrada en el día consultado
type DashboardFichaSinSesionRow struct {
	FichaID         uint
	FichaNumero     string
	ProgramaNombre  string
	JornadaNombre   string
	SedeNombre      string
	TotalAprendices int
}

type asistenciaRepository struct {
	db *gorm.DB
}

func NewAsistenciaRepository() AsistenciaRepository {
	return &asistenciaRepository{db: database.GetDB()}
}

// parseDashboardFechaRange devuelve [inicio, fin) del día civil en la zona horaria local del servidor,
// alineado con time.ParseInLocation al crear sesiones de asistencia (evita desfase respecto a UTC).
func parseDashboardFechaRange(fecha string) (time.Time, time.Time, error) {
	tInicio, err := time.ParseInLocation(time.DateOnly, fecha, time.Local)
	if err != nil {
		return time.Time{}, time.Time{}, err
	}
	return tInicio, tInicio.AddDate(0, 0, 1), nil
}

func (r *asistenciaRepository) Create(a *models.Asistencia) error {
	return r.db.Create(a).Error
}

func (r *asistenciaRepository) FindByID(id uint) (*models.Asistencia, error) {
	var m models.Asistencia
	if err := r.db.Preload("InstructorFicha").Preload(asistPreloadInstructorFichaFicha).Preload(asistPreloadAAAprendizPersona).
		First(&m, id).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *asistenciaRepository) FindByInstructorFichaID(instructorFichaID uint) ([]models.Asistencia, error) {
	var list []models.Asistencia
	if err := r.db.Where("instructor_ficha_id = ?", instructorFichaID).
		Preload(asistPreloadAAAprendizPersona).
		Order("fecha DESC, hora_inicio DESC").Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func (r *asistenciaRepository) FindActivaByInstructorFichaID(instructorFichaID uint) (*models.Asistencia, error) {
	var m models.Asistencia
	if err := r.db.Where("instructor_ficha_id = ? AND is_finished = ?", instructorFichaID, false).First(&m).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

// FindByInstructorFichaIDAndFecha devuelve la sesión más reciente del instructor-ficha en la fecha calendario dada (activa o finalizada).
func (r *asistenciaRepository) FindByInstructorFichaIDAndFecha(instructorFichaID uint, fecha time.Time) (*models.Asistencia, error) {
	loc := fecha.Location()
	if loc == nil {
		loc = time.Local
	}
	local := fecha.In(loc)
	tInicio := time.Date(local.Year(), local.Month(), local.Day(), 0, 0, 0, 0, loc)
	tFin := tInicio.AddDate(0, 0, 1)
	var m models.Asistencia
	if err := r.db.Where("instructor_ficha_id = ? AND fecha >= ? AND fecha < ?", instructorFichaID, tInicio, tFin).
		Order("hora_inicio DESC").
		First(&m).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &m, nil
}

// FindActivaByFichaID devuelve una sesión activa para la ficha (una sola por ficha según reglas de negocio)
func (r *asistenciaRepository) FindActivaByFichaID(fichaID uint) (*models.Asistencia, error) {
	var ids []uint
	r.db.Model(&models.InstructorFichaCaracterizacion{}).Where(asistCondFichaID, fichaID).Pluck("id", &ids)
	if len(ids) == 0 {
		return nil, nil
	}
	var m models.Asistencia
	if err := r.db.Where("instructor_ficha_id IN ? AND is_finished = ?", ids, false).First(&m).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *asistenciaRepository) FindByFichaIDAndFechas(fichaID uint, fechaInicio, fechaFin string) ([]models.Asistencia, error) {
	var ids []uint
	r.db.Model(&models.InstructorFichaCaracterizacion{}).Where(asistCondFichaID, fichaID).Pluck("id", &ids)
	if len(ids) == 0 {
		return nil, nil
	}
	var list []models.Asistencia
	if err := r.db.Where("instructor_ficha_id IN ? AND fecha >= ? AND fecha <= ?", ids, fechaInicio, fechaFin).
		Preload("InstructorFicha").Preload(asistPreloadInstructorFichaFicha).Preload(asistPreloadAAAprendizPersona).
		Order("fecha DESC, hora_inicio DESC").Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

// FindIDsByFichaIDAndFecha devuelve los IDs de sesiones de la ficha en la fecha dada (para regla "una entrada sin salida por día").
func (r *asistenciaRepository) FindIDsByFichaIDAndFecha(fichaID uint, fecha string) ([]uint, error) {
	var ids []uint
	r.db.Model(&models.InstructorFichaCaracterizacion{}).Where(asistCondFichaID, fichaID).Pluck("id", &ids)
	if len(ids) == 0 {
		return nil, nil
	}
	tInicio, err := ParseDate(fecha)
	if err != nil {
		return nil, err
	}
	tFin := tInicio.AddDate(0, 0, 1)
	var out []uint
	if err := r.db.Model(&models.Asistencia{}).
		Where("instructor_ficha_id IN ? AND fecha >= ? AND fecha < ?", ids, tInicio, tFin).
		Pluck("id", &out).Error; err != nil {
		return nil, err
	}
	return out, nil
}

func (r *asistenciaRepository) Update(a *models.Asistencia) error {
	return r.db.Save(a).Error
}

// GetDashboardResumen devuelve total de aprendices en formación en la fecha y desglose por ficha (opcional por sede).
// Usa rango del día en hora local (coherente con la creación de sesiones).
func (r *asistenciaRepository) GetDashboardResumen(sedeID *uint, fecha string) (totalAprendices int, porFicha []DashboardFichaRow, err error) {
	tInicio, tFin, err := parseDashboardFechaRange(fecha)
	if err != nil {
		return 0, nil, err
	}

	// IDs de asistencias del día (y sede si aplica)
	var asistenciaIDs []uint
	q := r.db.Table("asistencias a").
		Select("a.id").
		Joins("INNER JOIN instructor_fichas_caracterizacion ifc ON a.instructor_ficha_id = ifc.id").
		Joins("INNER JOIN fichas_caracterizacion fc ON ifc.ficha_id = fc.id").
		Where("a.fecha >= ? AND a.fecha < ?", tInicio, tFin)
	if sedeID != nil && *sedeID > 0 {
		q = q.Where("fc.sede_id = ?", *sedeID)
	}
	if err := q.Pluck("a.id", &asistenciaIDs).Error; err != nil {
		return 0, nil, err
	}
	if len(asistenciaIDs) == 0 {
		return 0, []DashboardFichaRow{}, nil
	}

	// Total aprendices que están "en formación" ahora (entraron y aún no han registrado salida)
	var total int64
	if err := r.db.Table("asistencia_aprendices aa").
		Where("aa.asistencia_id IN ? AND aa.hora_ingreso IS NOT NULL AND aa.hora_salida IS NULL", asistenciaIDs).
		Select("COUNT(DISTINCT aa.aprendiz_ficha_id)").
		Scan(&total).Error; err != nil {
		return 0, nil, err
	}
	totalAprendices = int(total)

	// Por ficha: vinieron hoy (asistencia efectiva) vs en formación ahora (sin salida).
	type row struct {
		FichaID             uint   `gorm:"column:ficha_id"`
		FichaNumero         string `gorm:"column:ficha_numero"`
		ProgramaNombre      string `gorm:"column:programa_nombre"`
		JornadaNombre       string `gorm:"column:jornada_nombre"`
		SedeNombre          string `gorm:"column:sede_nombre"`
		CantidadVinieron    int    `gorm:"column:cantidad_vinieron"`
		CantidadEnFormacion int    `gorm:"column:cantidad_en_formacion"`
		TotalAprendices     int    `gorm:"column:total_aprendices"`
	}
	var rows []row
	raw := `
		SELECT fc.id AS ficha_id, fc.ficha AS ficha_numero, COALESCE(pf.nombre, '') AS programa_nombre, COALESCE(j.nombre, '') AS jornada_nombre, COALESCE(s.nombre, '') AS sede_nombre,
		       COUNT(DISTINCT CASE WHEN ` + asistSQLAsistioEfectivo + ` THEN aa.aprendiz_ficha_id END)::int AS cantidad_vinieron,
		       COUNT(DISTINCT CASE WHEN aa.hora_ingreso IS NOT NULL AND aa.hora_salida IS NULL THEN aa.aprendiz_ficha_id END)::int AS cantidad_en_formacion,
		       COUNT(DISTINCT af.id)::int AS total_aprendices
		FROM asistencias a
		INNER JOIN instructor_fichas_caracterizacion ifc ON a.instructor_ficha_id = ifc.id
		INNER JOIN fichas_caracterizacion fc ON ifc.ficha_id = fc.id
		LEFT JOIN programas_formacion pf ON fc.programa_formacion_id = pf.id
		LEFT JOIN jornadas j ON fc.jornada_id = j.id
		LEFT JOIN sedes s ON fc.sede_id = s.id
		LEFT JOIN asistencia_aprendices aa ON aa.asistencia_id = a.id
		LEFT JOIN aprendices af ON af.ficha_caracterizacion_id = fc.id AND af.estado = true
		WHERE a.fecha >= ? AND a.fecha < ?
	`
	args := []interface{}{tInicio, tFin}
	if sedeID != nil && *sedeID > 0 {
		raw += asistSQLFilterSedeFicha
		args = append(args, *sedeID)
	}
	raw += " GROUP BY fc.id, fc.ficha, pf.nombre, j.nombre, s.nombre ORDER BY fc.ficha"
	if err := r.db.Raw(raw, args...).Scan(&rows).Error; err != nil {
		return totalAprendices, nil, err
	}
	porFicha = make([]DashboardFichaRow, len(rows))
	for i := range rows {
		porFicha[i] = DashboardFichaRow{
			FichaID:             rows[i].FichaID,
			FichaNumero:         rows[i].FichaNumero,
			ProgramaNombre:      rows[i].ProgramaNombre,
			JornadaNombre:       rows[i].JornadaNombre,
			SedeNombre:          rows[i].SedeNombre,
			CantidadVinieron:    rows[i].CantidadVinieron,
			CantidadEnFormacion: rows[i].CantidadEnFormacion,
			TotalAprendices:     rows[i].TotalAprendices,
		}
	}
	return totalAprendices, porFicha, nil
}

// GetFichasSinSesionHoy devuelve fichas activas (status=true, no eliminadas) que no tienen ninguna fila en asistencias
// para el rango del día indicado (coherente con GetDashboardResumen). Opcional filtro por sede.
func (r *asistenciaRepository) GetFichasSinSesionHoy(sedeID *uint, fecha string) ([]DashboardFichaSinSesionRow, error) {
	tInicio, tFin, err := parseDashboardFechaRange(fecha)
	if err != nil {
		return nil, err
	}

	type row struct {
		FichaID         uint   `gorm:"column:ficha_id"`
		FichaNumero     string `gorm:"column:ficha_numero"`
		ProgramaNombre  string `gorm:"column:programa_nombre"`
		JornadaNombre   string `gorm:"column:jornada_nombre"`
		SedeNombre      string `gorm:"column:sede_nombre"`
		TotalAprendices int    `gorm:"column:total_aprendices"`
	}
	var rows []row
	raw := `
SELECT fc.id AS ficha_id, fc.ficha AS ficha_numero,
			COALESCE(pf.nombre, '') AS programa_nombre,
			COALESCE(j.nombre, '') AS jornada_nombre,
			COALESCE(s.nombre, '') AS sede_nombre,
			COUNT(DISTINCT af.id)::int AS total_aprendices
		FROM fichas_caracterizacion fc
		LEFT JOIN programas_formacion pf ON fc.programa_formacion_id = pf.id
		LEFT JOIN jornadas j ON fc.jornada_id = j.id
		LEFT JOIN sedes s ON fc.sede_id = s.id
		LEFT JOIN aprendices af ON af.ficha_caracterizacion_id = fc.id AND af.estado = true AND af.deleted_at IS NULL
		WHERE fc.deleted_at IS NULL
		AND fc.status = true
		AND NOT EXISTS (
			SELECT 1 FROM asistencias a
			INNER JOIN instructor_fichas_caracterizacion ifc ON a.instructor_ficha_id = ifc.id
			WHERE ifc.ficha_id = fc.id
			AND a.deleted_at IS NULL
			AND a.fecha >= ? AND a.fecha < ?
		)
	`
	args := []interface{}{tInicio, tFin}
	if sedeID != nil && *sedeID > 0 {
		raw += asistSQLFilterSedeFicha
		args = append(args, *sedeID)
	}
	raw += " GROUP BY fc.id, fc.ficha, pf.nombre, j.nombre, s.nombre ORDER BY fc.ficha"
	if err := r.db.Raw(raw, args...).Scan(&rows).Error; err != nil {
		return nil, err
	}
	out := make([]DashboardFichaSinSesionRow, len(rows))
	for i := range rows {
		out[i] = DashboardFichaSinSesionRow{
			FichaID:         rows[i].FichaID,
			FichaNumero:     rows[i].FichaNumero,
			ProgramaNombre:  rows[i].ProgramaNombre,
			JornadaNombre:   rows[i].JornadaNombre,
			SedeNombre:      rows[i].SedeNombre,
			TotalAprendices: rows[i].TotalAprendices,
		}
	}
	return out, nil
}

// CountPendientesRevisionByFecha cuenta registros de asistencia del día con requiere_revision = true (opcional por sede).
func (r *asistenciaRepository) CountPendientesRevisionByFecha(sedeID *uint, fecha string) (int, error) {
	tInicio, tFin, err := parseDashboardFechaRange(fecha)
	if err != nil {
		return 0, err
	}
	q := r.db.Table("asistencia_aprendices aa").
		Joins("INNER JOIN asistencias a ON a.id = aa.asistencia_id").
		Joins("INNER JOIN instructor_fichas_caracterizacion ifc ON a.instructor_ficha_id = ifc.id").
		Joins("INNER JOIN fichas_caracterizacion fc ON ifc.ficha_id = fc.id").
		Where("aa.requiere_revision = ? AND a.fecha >= ? AND a.fecha < ?", true, tInicio, tFin)
	if sedeID != nil && *sedeID > 0 {
		q = q.Where("fc.sede_id = ?", *sedeID)
	}
	var count int64
	if err := q.Count(&count).Error; err != nil {
		return 0, err
	}
	return int(count), nil
}

func (r *asistenciaRepository) ListSesionesCasosBienestarEnRango(sedeID *uint, fechaInicio, fechaFin string) ([]SesionCasosBienestarRaw, error) {
	tInicio, err := time.Parse(time.DateOnly, fechaInicio)
	if err != nil {
		return nil, err
	}
	tFin, err := time.Parse(time.DateOnly, fechaFin)
	if err != nil {
		return nil, err
	}
	tFin = tFin.AddDate(0, 0, 1)

	type row struct {
		AsistenciaID uint      `gorm:"column:asistencia_id"`
		FichaID      uint      `gorm:"column:ficha_id"`
		InstructorID uint      `gorm:"column:instructor_id"`
		SedeID       uint      `gorm:"column:sede_id"`
		Fecha        time.Time `gorm:"column:fecha"`
	}
	raw := `
SELECT
  a.id AS asistencia_id,
  fc.id AS ficha_id,
  ifc.instructor_id,
  COALESCE(fc.sede_id, 0) AS sede_id,
  a.fecha::date AS fecha
FROM asistencias a
INNER JOIN instructor_fichas_caracterizacion ifc ON a.instructor_ficha_id = ifc.id
INNER JOIN fichas_caracterizacion fc ON ifc.ficha_id = fc.id
WHERE a.fecha >= ? AND a.fecha < ?
` + asistSQLSoloSesionesConAprendices
	args := []interface{}{tInicio, tFin}
	if sedeID != nil && *sedeID > 0 {
		raw += asistSQLFilterSedeFicha
		args = append(args, *sedeID)
	}
	var rows []row
	if err := r.db.Raw(raw, args...).Scan(&rows).Error; err != nil {
		return nil, err
	}
	out := make([]SesionCasosBienestarRaw, len(rows))
	for i := range rows {
		out[i] = SesionCasosBienestarRaw{
			AsistenciaID: rows[i].AsistenciaID,
			FichaID:      rows[i].FichaID,
			InstructorID: rows[i].InstructorID,
			SedeID:       rows[i].SedeID,
			Fecha:        rows[i].Fecha,
		}
	}
	return out, nil
}

func (r *asistenciaRepository) ListAprendicesActivosCasosBienestar(sedeID *uint) ([]AprendizCasosBienestarRaw, error) {
	type row struct {
		AprendizID       uint   `gorm:"column:aprendiz_id"`
		FichaID          uint   `gorm:"column:ficha_id"`
		FichaNumero      string `gorm:"column:ficha_numero"`
		PersonaNombre    string `gorm:"column:persona_nombre"`
		NumeroDocumento  string `gorm:"column:numero_documento"`
		ProgramaNombre   string `gorm:"column:programa_nombre"`
		SedeNombre       string `gorm:"column:sede_nombre"`
		JornadaNombre    string `gorm:"column:jornada_nombre"`
		InstructorNombre string `gorm:"column:instructor_nombre"`
		AmbienteNombre   string `gorm:"column:ambiente_nombre"`
		ModalidadNombre  string `gorm:"column:modalidad_nombre"`
	}
	raw := `
SELECT
  ap.id AS aprendiz_id,
  fc.id AS ficha_id,
  fc.ficha AS ficha_numero,
  TRIM(COALESCE(p.primer_nombre,'') || ' ' || COALESCE(p.segundo_nombre,'') || ' ' ||
       COALESCE(p.primer_apellido,'') || ' ' || COALESCE(p.segundo_apellido,'')) AS persona_nombre,
  COALESCE(p.numero_documento,'') AS numero_documento,
  COALESCE(pf.nombre,'') AS programa_nombre,
  COALESCE(s.nombre,'') AS sede_nombre,
  COALESCE(j.nombre,'') AS jornada_nombre,
  COALESCE(
    NULLIF(TRIM(COALESCE(ip.primer_nombre,'') || ' ' || COALESCE(ip.segundo_nombre,'') || ' ' ||
         COALESCE(ip.primer_apellido,'') || ' ' || COALESCE(ip.segundo_apellido,'')), ''),
    NULLIF(i.nombre_completo_cache,''),
    ''
  ) AS instructor_nombre,
  COALESCE(a.nombre,'') AS ambiente_nombre,
  COALESCE(mf.nombre,'') AS modalidad_nombre
FROM aprendices ap
INNER JOIN personas p ON p.id = ap.persona_id
INNER JOIN fichas_caracterizacion fc ON fc.id = ap.ficha_caracterizacion_id
LEFT JOIN programas_formacion pf ON pf.id = fc.programa_formacion_id
LEFT JOIN sedes s ON s.id = fc.sede_id
LEFT JOIN jornadas j ON j.id = fc.jornada_id
LEFT JOIN instructors i ON i.id = fc.instructor_id
LEFT JOIN personas ip ON ip.id = i.persona_id
LEFT JOIN ambientes a ON a.id = fc.ambiente_id
LEFT JOIN modalidades_formacion mf ON mf.id = fc.modalidad_formacion_id
WHERE ap.estado = true
`
	args := []interface{}{}
	if sedeID != nil && *sedeID > 0 {
		raw += asistSQLFilterSedeFicha
		args = append(args, *sedeID)
	}
	raw += " ORDER BY ap.id"
	var rows []row
	if err := r.db.Raw(raw, args...).Scan(&rows).Error; err != nil {
		return nil, err
	}
	out := make([]AprendizCasosBienestarRaw, len(rows))
	for i := range rows {
		out[i] = AprendizCasosBienestarRaw(rows[i])
	}
	return out, nil
}

func (r *asistenciaRepository) ListAsistenciasEfectivasEnSesiones(asistenciaIDs []uint) ([]AsistenciaEfectivaRaw, error) {
	if len(asistenciaIDs) == 0 {
		return nil, nil
	}
	type row struct {
		AprendizID    uint   `gorm:"column:aprendiz_id"`
		AsistenciaID  uint   `gorm:"column:asistencia_id"`
		Observaciones string `gorm:"column:observaciones"`
	}
	var rows []row
	err := r.db.Raw(`
SELECT
  aa.aprendiz_ficha_id AS aprendiz_id,
  aa.asistencia_id,
  COALESCE(aa.observaciones, '') AS observaciones
FROM asistencia_aprendices aa
WHERE aa.asistencia_id IN ?
  AND `+asistSQLAsistioEfectivo+`
`, asistenciaIDs).Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	out := make([]AsistenciaEfectivaRaw, len(rows))
	for i := range rows {
		out[i] = AsistenciaEfectivaRaw(rows[i])
	}
	return out, nil
}

func (r *asistenciaRepository) ListDetalleSesionesCasosBienestar(
	fichaNumero string,
	aprendizID uint,
	fechaInicio, fechaFin string,
	sedeNombre string,
) ([]DetalleSesionCasosBienestarRaw, error) {
	tInicio, err := time.Parse(time.DateOnly, fechaInicio)
	if err != nil {
		return nil, err
	}
	tFin, err := time.Parse(time.DateOnly, fechaFin)
	if err != nil {
		return nil, err
	}
	tFin = tFin.AddDate(0, 0, 1)

	type row struct {
		AsistenciaID     uint      `gorm:"column:asistencia_id"`
		FichaID          uint      `gorm:"column:ficha_id"`
		InstructorID     uint      `gorm:"column:instructor_id"`
		SedeID           uint      `gorm:"column:sede_id"`
		Fecha            time.Time `gorm:"column:fecha"`
		InstructorNombre string    `gorm:"column:instructor_nombre"`
		AsistioEfectivo  bool      `gorm:"column:asistio_efectivo"`
		Observaciones    string    `gorm:"column:observaciones"`
	}
	raw := `
SELECT
  a.id AS asistencia_id,
  fc.id AS ficha_id,
  ifc.instructor_id,
  COALESCE(fc.sede_id, 0) AS sede_id,
  a.fecha::date AS fecha,
  TRIM(COALESCE(p.primer_nombre,'') || ' ' || COALESCE(p.segundo_nombre,'') || ' ' ||
       COALESCE(p.primer_apellido,'') || ' ' || COALESCE(p.segundo_apellido,'')) AS instructor_nombre,
  COALESCE(
    aa.hora_ingreso IS NOT NULL
    AND (aa.estado IS NULL OR aa.estado = '' OR aa.estado = 'ASISTENCIA_COMPLETA' OR aa.estado = 'ASISTENCIA_PARCIAL'),
    false
  ) AS asistio_efectivo,
  COALESCE(aa.observaciones, '') AS observaciones
FROM asistencias a
INNER JOIN instructor_fichas_caracterizacion ifc ON a.instructor_ficha_id = ifc.id
INNER JOIN instructors i ON i.id = ifc.instructor_id
INNER JOIN personas p ON p.id = i.persona_id
INNER JOIN fichas_caracterizacion fc ON ifc.ficha_id = fc.id
LEFT JOIN sedes s ON s.id = fc.sede_id
LEFT JOIN asistencia_aprendices aa ON aa.asistencia_id = a.id AND aa.aprendiz_ficha_id = ?
WHERE a.fecha >= ? AND a.fecha < ?
  AND fc.ficha = ?
` + asistSQLSoloSesionesConAprendices + `
`
	args := []interface{}{aprendizID, tInicio, tFin, fichaNumero}
	if strings.TrimSpace(sedeNombre) != "" {
		raw += " AND COALESCE(s.nombre, '') = ?"
		args = append(args, sedeNombre)
	}
	raw += " ORDER BY a.fecha"
	var rows []row
	if err := r.db.Raw(raw, args...).Scan(&rows).Error; err != nil {
		return nil, err
	}
	out := make([]DetalleSesionCasosBienestarRaw, len(rows))
	for i := range rows {
		out[i] = DetalleSesionCasosBienestarRaw(rows[i])
	}
	return out, nil
}

// GetPendientesRevisionPorInstructor devuelve, para el rango de fechas, la cantidad de aprendices
// con registros de asistencia marcados como requiere_revision=true (por corregir) por instructor.
// Opcionalmente se puede filtrar por sede.
func (r *asistenciaRepository) GetPendientesRevisionPorInstructor(sedeID *uint, fechaInicio, fechaFin string) ([]PendienteInstructorRow, error) {
	tInicio, err := time.Parse(time.DateOnly, fechaInicio)
	if err != nil {
		return nil, err
	}
	tFin, err := time.Parse(time.DateOnly, fechaFin)
	if err != nil {
		return nil, err
	}
	tFin = tFin.AddDate(0, 0, 1) // exclusivo

	type row struct {
		InstructorID                uint   `gorm:"column:instructor_id"`
		InstructorNombre            string `gorm:"column:instructor_nombre"`
		NumeroDocumento             string `gorm:"column:numero_documento"`
		CantidadAprendicesSinSalida int    `gorm:"column:cantidad"`
	}

	raw := `
WITH sesiones_rango AS (
  SELECT a.id AS asistencia_id, ifc.instructor_id, fc.sede_id
  FROM asistencias a
  INNER JOIN instructor_fichas_caracterizacion ifc ON a.instructor_ficha_id = ifc.id
  INNER JOIN fichas_caracterizacion fc ON ifc.ficha_id = fc.id
  WHERE a.fecha >= ? AND a.fecha < ?
),
pendientes AS (
  SELECT sr.instructor_id, aa.aprendiz_ficha_id
  FROM asistencia_aprendices aa
  INNER JOIN sesiones_rango sr ON sr.asistencia_id = aa.asistencia_id
  WHERE aa.requiere_revision = TRUE
)
SELECT
  i.id AS instructor_id,
  TRIM(COALESCE(p.primer_nombre,'') || ' ' || COALESCE(p.segundo_nombre,'') || ' ' ||
       COALESCE(p.primer_apellido,'') || ' ' || COALESCE(p.segundo_apellido,'')) AS instructor_nombre,
  COALESCE(p.numero_documento,'') AS numero_documento,
  COUNT(DISTINCT pendientes.aprendiz_ficha_id)::int AS cantidad
FROM pendientes
INNER JOIN instructors i ON i.id = pendientes.instructor_id
INNER JOIN personas p ON p.id = i.persona_id
`
	args := []interface{}{tInicio, tFin}
	if sedeID != nil && *sedeID > 0 {
		raw += `
INNER JOIN instructor_fichas_caracterizacion ifc2 ON ifc2.instructor_id = i.id
INNER JOIN fichas_caracterizacion fc2 ON fc2.id = ifc2.ficha_id
WHERE fc2.sede_id = ?
`
		args = append(args, *sedeID)
	}
	raw += `
GROUP BY i.id, instructor_nombre, p.numero_documento
ORDER BY cantidad DESC, instructor_nombre
`

	var rows []row
	if err := r.db.Raw(raw, args...).Scan(&rows).Error; err != nil {
		return nil, err
	}

	out := make([]PendienteInstructorRow, len(rows))
	for i := range rows {
		out[i] = PendienteInstructorRow{
			InstructorID:                rows[i].InstructorID,
			InstructorNombre:            rows[i].InstructorNombre,
			NumeroDocumento:             rows[i].NumeroDocumento,
			CantidadAprendicesSinSalida: rows[i].CantidadAprendicesSinSalida,
		}
	}
	return out, nil
}

// FindSesionesNoFinalizadasDesde devuelve sesiones no finalizadas con fecha >= fechaDesde (YYYY-MM-DD),
// con Ficha y Jornada cargados para evaluar si ya pasó el horario de cierre.
func (r *asistenciaRepository) FindSesionesNoFinalizadasDesde(fechaDesde string) ([]models.Asistencia, error) {
	var list []models.Asistencia
	err := r.db.Where("is_finished = ? AND fecha >= ?", false, fechaDesde).
		Preload("InstructorFicha").
		Preload(asistPreloadInstructorFichaFicha).
		Preload(asistPreloadInstructorFichaFichaJornada).
		Find(&list).Error
	return list, err
}

// ParseDate parses YYYY-MM-DD to time.Time
func ParseDate(s string) (time.Time, error) {
	return time.Parse(time.DateOnly, s)
}
