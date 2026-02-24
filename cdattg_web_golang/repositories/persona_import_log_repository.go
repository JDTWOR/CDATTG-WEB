package repositories

import (
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

type PersonaImportLogRepository interface {
	Create(log *models.PersonaImportLog) error
	FindAll(limit int) ([]models.PersonaImportLog, error)
}

type personaImportLogRepository struct {
	db *gorm.DB
}

func NewPersonaImportLogRepository() PersonaImportLogRepository {
	return &personaImportLogRepository{db: database.GetDB()}
}

func (r *personaImportLogRepository) Create(log *models.PersonaImportLog) error {
	return r.db.Create(log).Error
}

func (r *personaImportLogRepository) FindAll(limit int) ([]models.PersonaImportLog, error) {
	if limit <= 0 {
		limit = 50
	}
	var list []models.PersonaImportLog
	if err := r.db.Preload("User").Order("created_at DESC").Limit(limit).Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}
