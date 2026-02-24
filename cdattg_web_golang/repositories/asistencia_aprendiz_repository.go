package repositories

import (
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

type AsistenciaAprendizRepository interface {
	Create(a *models.AsistenciaAprendiz) error
	FindByID(id uint) (*models.AsistenciaAprendiz, error)
	FindByAsistenciaID(asistenciaID uint) ([]models.AsistenciaAprendiz, error)
	FindByAsistenciaIDAndAprendizID(asistenciaID, aprendizID uint) (*models.AsistenciaAprendiz, error)
	FindEntryWithoutExitByAprendizIDAndAsistenciaIDs(aprendizID uint, asistenciaIDs []uint) (*models.AsistenciaAprendiz, error)
	FindEntryWithExitByAprendizIDAndAsistenciaIDs(aprendizID uint, asistenciaIDs []uint) (*models.AsistenciaAprendiz, error)
	Update(a *models.AsistenciaAprendiz) error
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
	if err := r.db.Preload("Aprendiz").Preload("Aprendiz.Persona").Preload("Asistencia").First(&m, id).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *asistenciaAprendizRepository) FindByAsistenciaID(asistenciaID uint) ([]models.AsistenciaAprendiz, error) {
	var list []models.AsistenciaAprendiz
	if err := r.db.Where("asistencia_id = ?", asistenciaID).
		Preload("Aprendiz").Preload("Aprendiz.Persona").Find(&list).Error; err != nil {
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
	if err := r.db.Where("aprendiz_ficha_id = ? AND asistencia_id IN ? AND hora_ingreso IS NOT NULL AND hora_salida IS NOT NULL", aprendizID, asistenciaIDs).Preload("Aprendiz").Preload("Aprendiz.Persona").First(&m).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *asistenciaAprendizRepository) Update(a *models.AsistenciaAprendiz) error {
	return r.db.Save(a).Error
}
