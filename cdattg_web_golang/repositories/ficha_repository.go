package repositories

import (
	"strings"
	"time"

	"github.com/sena/cdattg-web-golang/config"
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

type FichaRepository interface {
	FindByID(id uint) (*models.FichaCaracterizacion, error)
	FindByIDWithInstructoresAndAprendices(id uint) (*models.FichaCaracterizacion, error)
	FindByFicha(ficha string) (*models.FichaCaracterizacion, error)
	FindAll(page, pageSize int, programaID *uint, instructorID *uint, search string, tipoFormacion string) ([]models.FichaCaracterizacion, int64, error)
	FindActivasParaHoyConJornada(hoy time.Time) ([]models.FichaCaracterizacion, error)
	// FindActivasParaFechaConJornada fichas activas con formación el día de la semana de fecha; sedeID opcional.
	FindActivasParaFechaConJornada(fecha time.Time, sedeID *uint) ([]models.FichaCaracterizacion, error)
	// FindActivasSolapandoRango fichas activas cuyo período solapa [desde, hasta] (para análisis histórico).
	FindActivasSolapandoRango(desde, hasta time.Time, sedeIDs []uint, jornadaNombre string, soloEnFormacion bool) ([]models.FichaCaracterizacion, error)
	// FindSolapandoRango fichas cuyo período solapa [desde, hasta]; estadoFicha: activas|inactivas|todas.
	FindSolapandoRango(desde, hasta time.Time, sedeIDs []uint, jornadaNombre string, soloEnFormacion bool, estadoFicha string) ([]models.FichaCaracterizacion, error)
	// FindIDsByFichaOPrograma busca por número de ficha o nombre de programa (parcial).
	FindIDsByFichaOPrograma(search string, sedeIDs []uint) ([]uint, error)
	// ListIDsBySedesAndTipos IDs de fichas activas en sedes y tipos de formación indicados.
	ListIDsBySedesAndTipos(sedeIDs []uint, tiposFormacion []string) ([]uint, error)
	Search(query string) ([]models.FichaCaracterizacion, error)
	Create(ficha *models.FichaCaracterizacion) error
	Update(ficha *models.FichaCaracterizacion) error
	Delete(id uint) error
	ExistsByFicha(ficha string) bool
	ExistsByFichaExcludingID(ficha string, excludeID uint) bool
	// CountAll cuenta fichas activas (status=true, no eliminadas); sedeID opcional filtra por sede.
	CountAll(sedeID *uint) (int64, error)
	// SincronizarVigencia recalcula status de todas las fichas según el override manual
	// (status_manual) o la vigencia automática por fecha_inicio/fecha_fin.
	SincronizarVigencia() error
}

const (
	preloadAmbienteRuta      = "Ambiente.Piso.Bloque"
	fichaCondStatus          = "status = ?"
	fichaCondFechaFinVigente = "(fecha_fin IS NULL OR fecha_fin >= ?)"
	fichaSQLSedeIDIn         = "sede_id IN ?"
)

type fichaRepository struct {
	db               *gorm.DB
	lastSyncVigencia time.Time
	now              func() time.Time
}

func NewFichaRepository() FichaRepository {
	return &fichaRepository{
		db:  database.GetDB(),
		now: time.Now,
	}
}

func (r *fichaRepository) FindByID(id uint) (*models.FichaCaracterizacion, error) {
	var ficha models.FichaCaracterizacion
	if err := r.db.Preload("ProgramaFormacion").Preload("ProgramaFormacion.RedConocimiento").
		Preload("Instructor").Preload("Instructor.Persona").
		Preload("Sede").Preload(preloadAmbienteRuta).Preload("ModalidadFormacion").
		Preload("Jornada").
		Preload("FichaDiasFormacion").
		First(&ficha, id).Error; err != nil {
		return nil, err
	}
	return &ficha, nil
}

func (r *fichaRepository) FindByIDWithInstructoresAndAprendices(id uint) (*models.FichaCaracterizacion, error) {
	var ficha models.FichaCaracterizacion
	if err := r.db.Preload("ProgramaFormacion").Preload("Instructor").Preload("Sede").Preload(preloadAmbienteRuta).Preload("ModalidadFormacion").
		Preload("Jornada").Preload("FichaDiasFormacion").
		Preload("InstructorFichas.Instructor.Persona").Preload("InstructorFichas.Competencia").Preload("Aprendices.Persona").
		First(&ficha, id).Error; err != nil {
		return nil, err
	}
	return &ficha, nil
}

func (r *fichaRepository) FindByFicha(ficha string) (*models.FichaCaracterizacion, error) {
	var fichaModel models.FichaCaracterizacion
	norm := strings.TrimSpace(ficha)
	if norm == "" {
		return nil, gorm.ErrRecordNotFound
	}
	if err := r.db.Where("UPPER(ficha) = UPPER(?)", norm).First(&fichaModel).Error; err != nil {
		return nil, err
	}
	return &fichaModel, nil
}

// FindActivasParaHoyConJornada devuelve fichas activas (status=true, fecha_fin >= hoy) que tienen formación el día de la semana de hoy, con Jornada y FichaDiasFormacion cargados.
func (r *fichaRepository) FindActivasParaHoyConJornada(hoy time.Time) ([]models.FichaCaracterizacion, error) {
	return r.FindActivasParaFechaConJornada(hoy, nil)
}

// FindActivasParaFechaConJornada devuelve fichas activas con formación el día de la semana de fecha.
func (r *fichaRepository) FindActivasParaFechaConJornada(fecha time.Time, sedeID *uint) ([]models.FichaCaracterizacion, error) {
	weekday := int(fecha.Weekday()) // 0=Sunday, 1=Monday, ...
	diaFormacionID := weekday
	if diaFormacionID == 0 {
		diaFormacionID = 7
	}
	fechaStr := fecha.Format("2006-01-02")
	q := r.db.Where(fichaCondStatus, true)
	if !config.IgnorarVigenciaFicha() {
		q = q.Where(fichaCondFechaFinVigente, fechaStr)
	}
	q = q.Where("id IN (SELECT ficha_id FROM ficha_dias_formacion WHERE dia_formacion_id = ? AND deleted_at IS NULL)", diaFormacionID)
	if sedeID != nil && *sedeID > 0 {
		q = q.Where("sede_id = ?", *sedeID)
	}
	var list []models.FichaCaracterizacion
	err := q.Preload("Jornada").Preload("ProgramaFormacion").Preload("Sede").Preload("FichaDiasFormacion").
		Find(&list).Error
	return list, err
}

// FindActivasSolapandoRango devuelve fichas activas con vigencia que intersecta el rango consultado.
func (r *fichaRepository) FindActivasSolapandoRango(desde, hasta time.Time, sedeIDs []uint, jornadaNombre string, soloEnFormacion bool) ([]models.FichaCaracterizacion, error) {
	return r.FindSolapandoRango(desde, hasta, sedeIDs, jornadaNombre, soloEnFormacion, "activas")
}

// FindSolapandoRango devuelve fichas con vigencia que intersecta el rango; estadoFicha: activas|inactivas|todas.
func (r *fichaRepository) FindSolapandoRango(desde, hasta time.Time, sedeIDs []uint, jornadaNombre string, soloEnFormacion bool, estadoFicha string) ([]models.FichaCaracterizacion, error) {
	desdeStr := desde.Format(time.DateOnly)
	hastaStr := hasta.Format(time.DateOnly)
	q := r.db.Model(&models.FichaCaracterizacion{})
	switch strings.ToLower(strings.TrimSpace(estadoFicha)) {
	case "inactivas":
		q = q.Where(fichaCondStatus, false)
	case "todas":
		// sin filtro de status
	default:
		q = q.Where(fichaCondStatus, true)
	}
	if !config.IgnorarVigenciaFicha() {
		q = q.Where("(fecha_inicio IS NULL OR fecha_inicio <= ?)", hastaStr)
		if soloEnFormacion {
			nowStr := time.Now().Format(time.DateOnly)
			q = q.Where(fichaCondFechaFinVigente, nowStr)
		} else {
			q = q.Where(fichaCondFechaFinVigente, desdeStr)
		}
	}
	if len(sedeIDs) > 0 {
		q = q.Where(fichaSQLSedeIDIn, sedeIDs)
	}
	if strings.TrimSpace(jornadaNombre) != "" {
		q = q.Where("jornada_id IN (SELECT id FROM jornadas WHERE nombre = ? AND deleted_at IS NULL)", jornadaNombre)
	}
	var list []models.FichaCaracterizacion
	err := q.Preload("Jornada").Preload("ProgramaFormacion").Preload("Sede").Preload("FichaDiasFormacion").
		Order("ficha ASC").Find(&list).Error
	return list, err
}

// FindIDsByFichaOPrograma busca fichas por número o nombre de programa (coincidencia parcial, case-insensitive).
func (r *fichaRepository) FindIDsByFichaOPrograma(search string, sedeIDs []uint) ([]uint, error) {
	norm := strings.TrimSpace(search)
	if norm == "" {
		return nil, nil
	}
	pattern := "%" + strings.ToLower(strings.Join(strings.Fields(norm), "%")) + "%"
	q := r.db.Model(&models.FichaCaracterizacion{}).
		Where(
			"LOWER(ficha) LIKE ? OR LOWER(nombre) LIKE ? OR programa_formacion_id IN (SELECT id FROM programas_formacion WHERE LOWER(nombre) LIKE ? AND deleted_at IS NULL)",
			pattern, pattern, pattern,
		)
	if len(sedeIDs) > 0 {
		q = q.Where(fichaSQLSedeIDIn, sedeIDs)
	}
	var ids []uint
	if err := q.Pluck("id", &ids).Error; err != nil {
		return nil, err
	}
	return ids, nil
}

func (r *fichaRepository) ListIDsBySedesAndTipos(sedeIDs []uint, tiposFormacion []string) ([]uint, error) {
	if len(sedeIDs) == 0 {
		return nil, nil
	}
	q := r.db.Model(&models.FichaCaracterizacion{}).Where(fichaCondStatus, true)
	q = q.Where(fichaSQLSedeIDIn, sedeIDs)
	if len(tiposFormacion) > 0 {
		q = q.Where("tipo_formacion IN ?", tiposFormacion)
	}
	var ids []uint
	if err := q.Pluck("id", &ids).Error; err != nil {
		return nil, err
	}
	return ids, nil
}

func applyFichaListFilters(q *gorm.DB, programaID *uint, instructorID *uint, search string, tipoFormacion string) *gorm.DB {
	if programaID != nil && *programaID > 0 {
		q = q.Where("programa_formacion_id = ?", *programaID)
	}
	if instructorID != nil && *instructorID > 0 {
		q = q.Where("id IN (SELECT ficha_id FROM instructor_fichas_caracterizacion WHERE instructor_id = ? AND deleted_at IS NULL)", *instructorID)
	}
	if tipoFormacion != "" {
		q = q.Where("tipo_formacion = ?", tipoFormacion)
	}
	if search != "" {
		// Reemplazar espacios por % para permitir búsqueda parcial (ej. "analisis software" -> "%analisis%software%")
		// Convertimos el patrón a minúsculas y usamos LOWER() en las columnas para asegurar compatibilidad total en todas las bases de datos (y evitar problemas con ILIKE que es exclusivo de Postgres)
		searchPattern := "%" + strings.ToLower(strings.Join(strings.Fields(search), "%")) + "%"
		q = q.Where(
			"LOWER(ficha) LIKE ? OR LOWER(nombre) LIKE ? OR programa_formacion_id IN (SELECT id FROM programas_formacion WHERE LOWER(nombre) LIKE ? OR LOWER(codigo) LIKE ?)",
			searchPattern, searchPattern, searchPattern, searchPattern,
		)
	}
	return q
}

func (r *fichaRepository) FindAll(page, pageSize int, programaID *uint, instructorID *uint, search string, tipoFormacion string) ([]models.FichaCaracterizacion, int64, error) {
	var fichas []models.FichaCaracterizacion
	var total int64
	offset := (page - 1) * pageSize
	q := applyFichaListFilters(r.db.Model(&models.FichaCaracterizacion{}), programaID, instructorID, search, tipoFormacion)
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	findQ := applyFichaListFilters(
		r.db.Preload("ProgramaFormacion").Preload("Instructor").Preload(preloadAmbienteRuta).Preload("Sede").Preload("ModalidadFormacion").Preload("Jornada").Preload("FichaDiasFormacion"),
		programaID,
		instructorID,
		search,
		tipoFormacion,
	)
	if err := findQ.Offset(offset).Limit(pageSize).Find(&fichas).Error; err != nil {
		return nil, 0, err
	}
	return fichas, total, nil
}

func (r *fichaRepository) Search(query string) ([]models.FichaCaracterizacion, error) {
	var fichas []models.FichaCaracterizacion
	searchPattern := "%" + query + "%"

	if err := r.db.Where("ficha LIKE ?", searchPattern).
		Or("id IN (SELECT id FROM programas_formacion WHERE nombre LIKE ?)", searchPattern).
		Preload("ProgramaFormacion").Find(&fichas).Error; err != nil {
		return nil, err
	}

	return fichas, nil
}

func (r *fichaRepository) Create(ficha *models.FichaCaracterizacion) error {
	return r.db.Create(ficha).Error
}

func (r *fichaRepository) Update(ficha *models.FichaCaracterizacion) error {
	return r.db.Save(ficha).Error
}

func (r *fichaRepository) Delete(id uint) error {
	return r.db.Delete(&models.FichaCaracterizacion{}, id).Error
}

func (r *fichaRepository) ExistsByFicha(ficha string) bool {
	var count int64
	r.db.Model(&models.FichaCaracterizacion{}).Where("ficha = ?", ficha).Count(&count)
	return count > 0
}

func (r *fichaRepository) ExistsByFichaExcludingID(ficha string, excludeID uint) bool {
	var count int64
	r.db.Model(&models.FichaCaracterizacion{}).Where("ficha = ? AND id != ?", ficha, excludeID).Count(&count)
	return count > 0
}

func (r *fichaRepository) CountAll(sedeID *uint) (int64, error) {
	var n int64
	q := r.db.Model(&models.FichaCaracterizacion{}).Where(fichaCondStatus, true)
	if sedeID != nil && *sedeID > 0 {
		q = q.Where("sede_id = ?", *sedeID)
	}
	if err := q.Count(&n).Error; err != nil {
		return 0, err
	}
	return n, nil
}

// SincronizarVigencia recalcula status según el override manual o la vigencia automática por fechas.
// Se ejecuta como máximo una vez por intervalo (throttle) para no recargar cada petición.
func (r *fichaRepository) SincronizarVigencia() error {
	ahora := r.now()
	if !sincronizacionVigenciaPermitida(r.lastSyncVigencia, ahora, intervaloSyncVigencia) {
		return nil
	}
	sql := `UPDATE fichas_caracterizacion
		SET status = CASE
			WHEN status_manual IS NOT NULL THEN status_manual
			WHEN fecha_fin IS NOT NULL AND fecha_fin::date < CURRENT_DATE THEN false
			WHEN fecha_inicio IS NOT NULL AND fecha_inicio::date > CURRENT_DATE THEN false
			ELSE true
		END
		WHERE deleted_at IS NULL
		  AND status <> CASE
			WHEN status_manual IS NOT NULL THEN status_manual
			WHEN fecha_fin IS NOT NULL AND fecha_fin::date < CURRENT_DATE THEN false
			WHEN fecha_inicio IS NOT NULL AND fecha_inicio::date > CURRENT_DATE THEN false
			ELSE true
		  END`
	if err := r.db.Exec(sql).Error; err != nil {
		return err
	}
	r.lastSyncVigencia = ahora
	return nil
}
