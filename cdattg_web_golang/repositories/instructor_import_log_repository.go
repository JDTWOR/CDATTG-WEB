package repositories

import (
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

// InstructorImportLogRepository define operaciones para el log de importación de instructores.
type InstructorImportLogRepository interface {
	Create(log *models.InstructorImportLog) error
	FindAll(limit int) ([]models.InstructorImportLog, error)
}

type instructorImportLogRepository struct {
	db *gorm.DB
}

// NewInstructorImportLogRepository crea el repositorio.
func NewInstructorImportLogRepository() InstructorImportLogRepository {
	return &instructorImportLogRepository{db: database.GetDB()}
}

func (r *instructorImportLogRepository) Create(log *models.InstructorImportLog) error {
	return r.db.Create(log).Error
}

func (r *instructorImportLogRepository) FindAll(limit int) ([]models.InstructorImportLog, error) {
	if limit <= 0 {
		limit = 50
	}
	var list []models.InstructorImportLog
	if err := r.db.Preload("User").Order("created_at DESC").Limit(limit).Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}
