// @module personal_rol_import_log_repository
// @description Acceso a datos del log de importaciones de roles de personal.
// @author JDTWOR
// @created 2026-08-14
package repositories

import (
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

// PersonalRolImportLogRepository define operaciones para el log de importación de personal.
type PersonalRolImportLogRepository interface {
	Create(log *models.PersonalRolImportLog) error
	FindAll(tipo string, limit int) ([]models.PersonalRolImportLog, error)
}

type personalRolImportLogRepository struct {
	db *gorm.DB
}

// NewPersonalRolImportLogRepository crea el repositorio.
func NewPersonalRolImportLogRepository() PersonalRolImportLogRepository {
	return &personalRolImportLogRepository{db: database.GetDB()}
}

func (r *personalRolImportLogRepository) Create(log *models.PersonalRolImportLog) error {
	return r.db.Create(log).Error
}

func (r *personalRolImportLogRepository) FindAll(tipo string, limit int) ([]models.PersonalRolImportLog, error) {
	if limit <= 0 {
		limit = 50
	}
	var list []models.PersonalRolImportLog
	if err := r.db.Where("tipo = ?", tipo).Preload("User").Order("created_at DESC").Limit(limit).Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}