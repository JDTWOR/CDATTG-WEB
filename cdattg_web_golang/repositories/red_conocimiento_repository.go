package repositories

import (
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

type RedConocimientoRepository interface {
	FindByID(id uint) (*models.RedConocimiento, error)
	FindByName(nombre string) (*models.RedConocimiento, error)
	FindAll() ([]models.RedConocimiento, error)
	Create(r *models.RedConocimiento) error
}

type redConocimientoRepository struct {
	db *gorm.DB
}

func NewRedConocimientoRepository() RedConocimientoRepository {
	return &redConocimientoRepository{db: database.GetDB()}
}

func (r *redConocimientoRepository) FindByID(id uint) (*models.RedConocimiento, error) {
	var red models.RedConocimiento
	if err := r.db.First(&red, id).Error; err != nil {
		return nil, err
	}
	return &red, nil
}

func (r *redConocimientoRepository) FindByName(nombre string) (*models.RedConocimiento, error) {
	var red models.RedConocimiento
	if err := r.db.Where("UPPER(TRIM(nombre)) = ?", nombre).First(&red).Error; err != nil {
		return nil, err
	}
	return &red, nil
}

func (r *redConocimientoRepository) FindAll() ([]models.RedConocimiento, error) {
	var list []models.RedConocimiento
	if err := r.db.Order("nombre").Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func (r *redConocimientoRepository) Create(red *models.RedConocimiento) error {
	return r.db.Create(red).Error
}
