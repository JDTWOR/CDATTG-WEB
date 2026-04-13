package repositories

import (
	"time"

	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

const (
	aaPreloadAprendizPersona                    = "Aprendiz.Persona"
	aaPreloadInstructorIngresoInstructor        = "InstructorRegistroIngreso.Instructor"
	aaPreloadInstructorIngresoInstructorPersona = "InstructorRegistroIngreso.Instructor.Persona"
	aaPreloadInstructorSalidaInstructor         = "InstructorRegistroSalida.Instructor"
	aaPreloadInstructorSalidaInstructorPersona  = "InstructorRegistroSalida.Instructor.Persona"
)

type AsistenciaAprendizRepository interface {
	Create(a *models.AsistenciaAprendiz) error
	FindByID(id uint) (*models.AsistenciaAprendiz, error)
	FindByAsistenciaID(asistenciaID uint) ([]models.AsistenciaAprendiz, error)
	FindByAsistenciaIDAndAprendizID(asistenciaID, aprendizID uint) (*models.AsistenciaAprendiz, error)
	// FindOpenByAsistenciaIDAndAprendizID devuelve el tramo abierto (ingreso sin salida) del aprendiz en la sesión, si existe.
	FindOpenByAsistenciaIDAndAprendizID(asistenciaID, aprendizID uint) (*models.AsistenciaAprendiz, error)
	// FindLastByAsistenciaIDAndAprendizID devuelve el último registro del aprendiz en la sesión (por id), para observaciones.
	FindLastByAsistenciaIDAndAprendizID(asistenciaID, aprendizID uint) (*models.AsistenciaAprendiz, error)
	FindEntryWithoutExitByAprendizIDAndAsistenciaIDs(aprendizID uint, asistenciaIDs []uint) (*models.AsistenciaAprendiz, error)
	FindEntryWithExitByAprendizIDAndAsistenciaIDs(aprendizID uint, asistenciaIDs []uint) (*models.AsistenciaAprendiz, error)
	FindPendientesRevisionByInstructorAndFecha(instructorID uint, fecha string) ([]models.AsistenciaAprendiz, error)
	Update(a *models.AsistenciaAprendiz) error
	ReplaceTiposObservacion(aa *models.AsistenciaAprendiz, tipos []models.TipoObservacionAsistencia) error
}

type asistenciaAprendizRepository struct {
	db *gorm.DB
}

func NewAsistenciaAprendizRepository() AsistenciaAprendizRepository {
	return &asistenciaAprendizRepository{db: database.GetDB()}
}

func (r *asistenciaAprendizRepository) Create(a *models.AsistenciaAprendiz) error {
	return r.db.Create(a).Error
}

func (r *asistenciaAprendizRepository) FindByID(id uint) (*models.AsistenciaAprendiz, error) {
	var m models.AsistenciaAprendiz
	if err := r.db.Preload("Aprendiz").Preload(aaPreloadAprendizPersona).
		Preload("Asistencia").
		Preload("Asistencia.InstructorFicha").Preload("Asistencia.InstructorFicha.Ficha").
		Preload("InstructorRegistroIngreso").Preload(aaPreloadInstructorIngresoInstructor).Preload(aaPreloadInstructorIngresoInstructorPersona).
		Preload("InstructorRegistroSalida").Preload(aaPreloadInstructorSalidaInstructor).Preload(aaPreloadInstructorSalidaInstructorPersona).
		Preload("TiposObservacion").
		First(&m, id).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *asistenciaAprendizRepository) FindByAsistenciaID(asistenciaID uint) ([]models.AsistenciaAprendiz, error) {
	var list []models.AsistenciaAprendiz
	if err := r.db.Where("asistencia_id = ?", asistenciaID).
		Preload("Aprendiz").Preload(aaPreloadAprendizPersona).
		Preload("InstructorRegistroIngreso").Preload(aaPreloadInstructorIngresoInstructor).Preload(aaPreloadInstructorIngresoInstructorPersona).
		Preload("InstructorRegistroSalida").Preload(aaPreloadInstructorSalidaInstructor).Preload(aaPreloadInstructorSalidaInstructorPersona).
		Preload("TiposObservacion").
		Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func (r *asistenciaAprendizRepository) FindByAsistenciaIDAndAprendizID(asistenciaID, aprendizID uint) (*models.AsistenciaAprendiz, error) {
	var m models.AsistenciaAprendiz
	if err := r.db.Where("asistencia_id = ? AND aprendiz_ficha_id = ?", asistenciaID, aprendizID).First(&m).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

// FindOpenByAsistenciaIDAndAprendizID devuelve el registro con ingreso y sin salida del aprendiz en esta sesión (tramo abierto).
func (r *asistenciaAprendizRepository) FindOpenByAsistenciaIDAndAprendizID(asistenciaID, aprendizID uint) (*models.AsistenciaAprendiz, error) {
	var m models.AsistenciaAprendiz
	if err := r.db.Where("asistencia_id = ? AND aprendiz_ficha_id = ? AND hora_ingreso IS NOT NULL AND hora_salida IS NULL", asistenciaID, aprendizID).First(&m).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

// FindLastByAsistenciaIDAndAprendizID devuelve el último registro del aprendiz en la sesión (por id desc).
func (r *asistenciaAprendizRepository) FindLastByAsistenciaIDAndAprendizID(asistenciaID, aprendizID uint) (*models.AsistenciaAprendiz, error) {
	var m models.AsistenciaAprendiz
	if err := r.db.Where("asistencia_id = ? AND aprendiz_ficha_id = ?", asistenciaID, aprendizID).Order("id DESC").First(&m).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

// FindEntryWithoutExitByAprendizIDAndAsistenciaIDs busca un registro con ingreso y sin salida del aprendiz en alguna de las sesiones (regla una entrada sin salida por día).
func (r *asistenciaAprendizRepository) FindEntryWithoutExitByAprendizIDAndAsistenciaIDs(aprendizID uint, asistenciaIDs []uint) (*models.AsistenciaAprendiz, error) {
	if len(asistenciaIDs) == 0 {
		return nil, gorm.ErrRecordNotFound
	}
	var m models.AsistenciaAprendiz
	if err := r.db.Where("aprendiz_ficha_id = ? AND asistencia_id IN ? AND hora_ingreso IS NOT NULL AND hora_salida IS NULL", aprendizID, asistenciaIDs).First(&m).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

// FindEntryWithExitByAprendizIDAndAsistenciaIDs busca un registro con ingreso y salida del aprendiz en alguna de las sesiones (asistencia completa hoy).
func (r *asistenciaAprendizRepository) FindEntryWithExitByAprendizIDAndAsistenciaIDs(aprendizID uint, asistenciaIDs []uint) (*models.AsistenciaAprendiz, error) {
	if len(asistenciaIDs) == 0 {
		return nil, gorm.ErrRecordNotFound
	}
	var m models.AsistenciaAprendiz
	if err := r.db.Where("aprendiz_ficha_id = ? AND asistencia_id IN ? AND hora_ingreso IS NOT NULL AND hora_salida IS NOT NULL", aprendizID, asistenciaIDs).Preload("Aprendiz").Preload(aaPreloadAprendizPersona).First(&m).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

// FindPendientesRevisionByInstructorAndFecha devuelve registros con requiere_revision=true
// para las sesiones del instructor. Si se pasa fecha (YYYY-MM-DD),
// se filtra por ese día; si no, trae todos los pendientes.
func (r *asistenciaAprendizRepository) FindPendientesRevisionByInstructorAndFecha(instructorID uint, fecha string) ([]models.AsistenciaAprendiz, error) {
	var list []models.AsistenciaAprendiz
	if instructorID == 0 {
		return list, nil
	}
	db := r.db.Model(&models.AsistenciaAprendiz{}).
		Joins("INNER JOIN asistencias a ON a.id = asistencia_aprendices.asistencia_id").
		Joins("INNER JOIN instructor_fichas_caracterizacion ifc ON a.instructor_ficha_id = ifc.id").
		Where("ifc.instructor_id = ? AND asistencia_aprendices.requiere_revision = ?", instructorID, true).
		Preload("Aprendiz").Preload(aaPreloadAprendizPersona).
		Preload("Asistencia").
		Preload("Asistencia.InstructorFicha").
		Preload("Asistencia.InstructorFicha.Ficha").
		Preload("InstructorRegistroIngreso").Preload(aaPreloadInstructorIngresoInstructor).Preload(aaPreloadInstructorIngresoInstructorPersona).
		Preload("InstructorRegistroSalida").Preload(aaPreloadInstructorSalidaInstructor).Preload(aaPreloadInstructorSalidaInstructorPersona)

	// Si viene fecha, filtrar por rango del día para evitar problemas de tipos/hora
	if fecha != "" {
		if tInicio, err := time.Parse("2006-01-02", fecha); err == nil {
			tFin := tInicio.AddDate(0, 0, 1)
			db = db.Where("a.fecha >= ? AND a.fecha < ?", tInicio, tFin)
		}
	}

	if err := db.Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func (r *asistenciaAprendizRepository) Update(a *models.AsistenciaAprendiz) error {
	return r.db.Save(a).Error
}

func (r *asistenciaAprendizRepository) ReplaceTiposObservacion(aa *models.AsistenciaAprendiz, tipos []models.TipoObservacionAsistencia) error {
	return r.db.Model(aa).Association("TiposObservacion").Replace(tipos)
}
