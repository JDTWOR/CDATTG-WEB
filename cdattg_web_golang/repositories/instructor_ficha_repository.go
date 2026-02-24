package repositories

import (
	"time"

	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

type InstructorFichaRepository interface {
	FindByID(id uint) (*models.InstructorFichaCaracterizacion, error)
	FindByFichaID(fichaID uint) ([]models.InstructorFichaCaracterizacion, error)
	FindByFichaIDAndInstructorID(fichaID, instructorID uint) (*models.InstructorFichaCaracterizacion, error)
	CountActiveFichasByInstructorID(instructorID uint) (int, error)
	Create(m *models.InstructorFichaCaracterizacion) error
	Update(m *models.InstructorFichaCaracterizacion) error
	Delete(id uint) error
	DeleteByFichaIDAndInstructorID(fichaID, instructorID uint) error
}

type instructorFichaRepository struct {
	db *gorm.DB
}

func NewInstructorFichaRepository() InstructorFichaRepository {
	return &instructorFichaRepository{db: database.GetDB()}
}

func (r *instructorFichaRepository) FindByID(id uint) (*models.InstructorFichaCaracterizacion, error) {
	var m models.InstructorFichaCaracterizacion
	if err := r.db.Preload("Ficha").First(&m, id).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *instructorFichaRepository) FindByFichaID(fichaID uint) ([]models.InstructorFichaCaracterizacion, error) {
	var list []models.InstructorFichaCaracterizacion
	if err := r.db.Where("ficha_id = ?", fichaID).
		Preload("Instructor").Preload("Instructor.Persona").Preload("Competencia").
		Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func (r *instructorFichaRepository) FindByFichaIDAndInstructorID(fichaID, instructorID uint) (*models.InstructorFichaCaracterizacion, error) {
	var m models.InstructorFichaCaracterizacion
	if err := r.db.Where("ficha_id = ? AND instructor_id = ?", fichaID, instructorID).First(&m).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

// CountActiveFichasByInstructorID cuenta fichas activas (status=true, fecha_fin >= hoy) asignadas al instructor
func (r *instructorFichaRepository) CountActiveFichasByInstructorID(instructorID uint) (int, error) {
	var count int64
	hoy := time.Now().Format("2006-01-02")
	err := r.db.Table("instructor_fichas_caracterizacion").
		Joins("INNER JOIN fichas_caracterizacion f ON f.id = instructor_fichas_caracterizacion.ficha_id").
		Where("instructor_fichas_caracterizacion.instructor_id = ?", instructorID).
		Where("f.status = ?", true).
		Where("(f.fecha_fin IS NULL OR f.fecha_fin >= ?)", hoy).
		Count(&count).Error
	if err != nil {
		return 0, err
	}
	return int(count), nil
}

func (r *instructorFichaRepository) Create(m *models.InstructorFichaCaracterizacion) error {
	return r.db.Create(m).Error
}

func (r *instructorFichaRepository) Update(m *models.InstructorFichaCaracterizacion) error {
	return r.db.Save(m).Error
}

func (r *instructorFichaRepository) Delete(id uint) error {
	return r.db.Delete(&models.InstructorFichaCaracterizacion{}, id).Error
}

func (r *instructorFichaRepository) DeleteByFichaIDAndInstructorID(fichaID, instructorID uint) error {
	return r.db.Where("ficha_id = ? AND instructor_id = ?", fichaID, instructorID).Delete(&models.InstructorFichaCaracterizacion{}).Error
}
