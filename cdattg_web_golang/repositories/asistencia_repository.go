package repositories

import (
	"time"

	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

type AsistenciaRepository interface {
	Create(a *models.Asistencia) error
	FindByID(id uint) (*models.Asistencia, error)
	FindByInstructorFichaID(instructorFichaID uint) ([]models.Asistencia, error)
	FindActivaByInstructorFichaID(instructorFichaID uint) (*models.Asistencia, error)
	FindActivaByFichaID(fichaID uint) (*models.Asistencia, error)
	FindByFichaIDAndFechas(fichaID uint, fechaInicio, fechaFin string) ([]models.Asistencia, error)
	FindIDsByFichaIDAndFecha(fichaID uint, fecha string) ([]uint, error)
	Update(a *models.Asistencia) error
	GetDashboardResumen(sedeID *uint, fecha string) (totalAprendices int, porFicha []DashboardFichaRow, err error)
}

// DashboardFichaRow una fila del resumen por ficha para el dashboard
type DashboardFichaRow struct {
	FichaID     uint
	FichaNumero string
	SedeNombre  string
	Cantidad    int
}

type asistenciaRepository struct {
	db *gorm.DB
}

func NewAsistenciaRepository() AsistenciaRepository {
	return &asistenciaRepository{db: database.GetDB()}
}

func (r *asistenciaRepository) Create(a *models.Asistencia) error {
	return r.db.Create(a).Error
}

func (r *asistenciaRepository) FindByID(id uint) (*models.Asistencia, error) {
	var m models.Asistencia
	if err := r.db.Preload("InstructorFicha").Preload("InstructorFicha.Ficha").Preload("AsistenciaAprendices.Aprendiz.Persona").
		First(&m, id).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *asistenciaRepository) FindByInstructorFichaID(instructorFichaID uint) ([]models.Asistencia, error) {
	var list []models.Asistencia
	if err := r.db.Where("instructor_ficha_id = ?", instructorFichaID).
		Preload("AsistenciaAprendices.Aprendiz.Persona").
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

// FindActivaByFichaID devuelve una sesión activa para la ficha (una sola por ficha según reglas de negocio)
func (r *asistenciaRepository) FindActivaByFichaID(fichaID uint) (*models.Asistencia, error) {
	var ids []uint
	r.db.Model(&models.InstructorFichaCaracterizacion{}).Where("ficha_id = ?", fichaID).Pluck("id", &ids)
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
	r.db.Model(&models.InstructorFichaCaracterizacion{}).Where("ficha_id = ?", fichaID).Pluck("id", &ids)
	if len(ids) == 0 {
		return nil, nil
	}
	var list []models.Asistencia
	if err := r.db.Where("instructor_ficha_id IN ? AND fecha >= ? AND fecha <= ?", ids, fechaInicio, fechaFin).
		Preload("InstructorFicha").Preload("InstructorFicha.Ficha").Preload("AsistenciaAprendices.Aprendiz.Persona").
		Order("fecha DESC, hora_inicio DESC").Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

// FindIDsByFichaIDAndFecha devuelve los IDs de sesiones de la ficha en la fecha dada (para regla "una entrada sin salida por día").
func (r *asistenciaRepository) FindIDsByFichaIDAndFecha(fichaID uint, fecha string) ([]uint, error) {
	var ids []uint
	r.db.Model(&models.InstructorFichaCaracterizacion{}).Where("ficha_id = ?", fichaID).Pluck("id", &ids)
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
// Usa rango de fechas (fecha inicio y fin de día) para evitar problemas de zona horaria con DATE().
func (r *asistenciaRepository) GetDashboardResumen(sedeID *uint, fecha string) (totalAprendices int, porFicha []DashboardFichaRow, err error) {
	// Rango del día en UTC (igual que Go guarda con time.Parse("2006-01-02"))
	tInicio, err := time.Parse("2006-01-02", fecha)
	if err != nil {
		return 0, nil, err
	}
	tFin := tInicio.AddDate(0, 0, 1)

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
	if err := r.db.Table("asistencia_aprendices").Where("asistencia_id IN ? AND hora_ingreso IS NOT NULL AND hora_salida IS NULL", asistenciaIDs).
		Select("COUNT(DISTINCT aprendiz_ficha_id)").
		Scan(&total).Error; err != nil {
		return 0, nil, err
	}
	totalAprendices = int(total)

	// Por ficha: ficha_id, ficha_numero, sede_nombre, count(aa.id)
	type row struct {
		FichaID     uint   `gorm:"column:ficha_id"`
		FichaNumero string `gorm:"column:ficha_numero"`
		SedeNombre  string `gorm:"column:sede_nombre"`
		Cantidad    int    `gorm:"column:cantidad"`
	}
	var rows []row
	raw := `
		SELECT fc.id AS ficha_id, fc.ficha AS ficha_numero, COALESCE(s.nombre, '') AS sede_nombre,
		       COUNT(aa.id)::int AS cantidad
		FROM asistencias a
		INNER JOIN instructor_fichas_caracterizacion ifc ON a.instructor_ficha_id = ifc.id
		INNER JOIN fichas_caracterizacion fc ON ifc.ficha_id = fc.id
		LEFT JOIN sedes s ON fc.sede_id = s.id
		LEFT JOIN asistencia_aprendices aa ON aa.asistencia_id = a.id AND aa.hora_ingreso IS NOT NULL AND aa.hora_salida IS NULL
		WHERE a.fecha >= ? AND a.fecha < ?
	`
	args := []interface{}{tInicio, tFin}
	if sedeID != nil && *sedeID > 0 {
		raw += " AND fc.sede_id = ?"
		args = append(args, *sedeID)
	}
	raw += " GROUP BY fc.id, fc.ficha, s.nombre ORDER BY fc.ficha"
	if err := r.db.Raw(raw, args...).Scan(&rows).Error; err != nil {
		return totalAprendices, nil, err
	}
	porFicha = make([]DashboardFichaRow, len(rows))
	for i := range rows {
		porFicha[i] = DashboardFichaRow{
			FichaID:     rows[i].FichaID,
			FichaNumero: rows[i].FichaNumero,
			SedeNombre:  rows[i].SedeNombre,
			Cantidad:    rows[i].Cantidad,
		}
	}
	return totalAprendices, porFicha, nil
}

// ParseDate parses YYYY-MM-DD to time.Time
func ParseDate(s string) (time.Time, error) {
	return time.Parse("2006-01-02", s)
}
