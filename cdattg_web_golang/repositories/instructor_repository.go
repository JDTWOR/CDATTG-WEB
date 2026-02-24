package repositories

import (
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

type InstructorRepository interface {
	FindAll() ([]models.Instructor, error)
	FindByID(id uint) (*models.Instructor, error)
	FindByPersonaID(personaID uint) (*models.Instructor, error)
	Create(instructor *models.Instructor) error
	Update(instructor *models.Instructor) error
	Delete(id uint) error
}

type instructorRepository struct {
	db *gorm.DB
}

func NewInstructorRepository() InstructorRepository {
	return &instructorRepository{db: database.GetDB()}
}

func (r *instructorRepository) FindAll() ([]models.Instructor, error) {
	var list []models.Instructor
	// Joins("Persona") asegura cargar persona en la misma consulta; documento y nombre vienen de Persona
	if err := r.db.Joins("Persona").Preload("Regional").Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func (r *instructorRepository) FindByID(id uint) (*models.Instructor, error) {
	var m models.Instructor
	if err := r.db.Joins("Persona").Preload("Regional").First(&m, id).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *instructorRepository) FindByPersonaID(personaID uint) (*models.Instructor, error) {
	var m models.Instructor
	if err := r.db.Where("persona_id = ?", personaID).First(&m).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *instructorRepository) Create(instructor *models.Instructor) error {
	return r.db.Create(instructor).Error
}

func (r *instructorRepository) Update(instructor *models.Instructor) error {
	return r.db.Save(instructor).Error
}

func (r *instructorRepository) Delete(id uint) error {
	return r.db.Delete(&models.Instructor{}, id).Error
}
