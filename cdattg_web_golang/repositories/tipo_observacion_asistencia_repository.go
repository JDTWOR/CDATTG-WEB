package repositories

import (
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

type TipoObservacionAsistenciaRepository interface {
	ListActivos() ([]models.TipoObservacionAsistencia, error)
	FindByIDs(ids []uint) ([]models.TipoObservacionAsistencia, error)
	Create(item *models.TipoObservacionAsistencia) error
}

type tipoObservacionAsistenciaRepository struct {
	db *gorm.DB
}

func NewTipoObservacionAsistenciaRepository() TipoObservacionAsistenciaRepository {
	return &tipoObservacionAsistenciaRepository{db: database.GetDB()}
}

func (r *tipoObservacionAsistenciaRepository) ListActivos() ([]models.TipoObservacionAsistencia, error) {
	var list []models.TipoObservacionAsistencia
	if err := r.db.Where("activo = ?", true).Order("nombre ASC").Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func (r *tipoObservacionAsistenciaRepository) FindByIDs(ids []uint) ([]models.TipoObservacionAsistencia, error) {
	if len(ids) == 0 {
		return nil, nil
	}
	var list []models.TipoObservacionAsistencia
	if err := r.db.Where("id IN ? AND activo = ?", ids, true).Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func (r *tipoObservacionAsistenciaRepository) Create(item *models.TipoObservacionAsistencia) error {
	return r.db.Create(item).Error
}
