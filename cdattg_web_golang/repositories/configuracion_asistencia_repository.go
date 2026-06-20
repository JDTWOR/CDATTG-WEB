package repositories

import (
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

type ConfiguracionAsistenciaRepository struct {
	db *gorm.DB
}

func NewConfiguracionAsistenciaRepository() *ConfiguracionAsistenciaRepository {
	return &ConfiguracionAsistenciaRepository{db: database.GetDB()}
}

func (r *ConfiguracionAsistenciaRepository) FindSingleton() (*models.ConfiguracionAsistencia, error) {
	var cfg models.ConfiguracionAsistencia
	err := r.db.First(&cfg, 1).Error
	if err != nil {
		return nil, err
	}
	return &cfg, nil
}

func (r *ConfiguracionAsistenciaRepository) UpsertSingleton(cfg *models.ConfiguracionAsistencia) error {
	cfg.ID = 1
	return r.db.Save(cfg).Error
}
