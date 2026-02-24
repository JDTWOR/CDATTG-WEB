package repositories

import (
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

type EvidenciaRepository interface {
	Create(e *models.Evidencia) error
	FindByID(id uint) (*models.Evidencia, error)
	Update(e *models.Evidencia) error
}

type evidenciaRepository struct {
	db *gorm.DB
}

func NewEvidenciaRepository() EvidenciaRepository {
	return &evidenciaRepository{db: database.GetDB()}
}

func (r *evidenciaRepository) Create(e *models.Evidencia) error {
	return r.db.Create(e).Error
}

func (r *evidenciaRepository) FindByID(id uint) (*models.Evidencia, error) {
	var m models.Evidencia
	if err := r.db.First(&m, id).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *evidenciaRepository) Update(e *models.Evidencia) error {
	return r.db.Save(e).Error
}
