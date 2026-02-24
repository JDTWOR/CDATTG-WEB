package repositories

import (
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models/inventario"
	"gorm.io/gorm"
)

type AprobacionRepository interface {
	Create(a *inventario.Aprobacion) error
	FindByID(id uint) (*inventario.Aprobacion, error)
	FindByOrdenID(ordenID uint) ([]inventario.Aprobacion, error)
	FindByDetalleOrdenID(detalleOrdenID uint) ([]inventario.Aprobacion, error)
	ExisteAprobacionParaDetalle(detalleOrdenID uint) (bool, error)
}

type aprobacionRepository struct {
	db *gorm.DB
}

func NewAprobacionRepository() AprobacionRepository {
	return &aprobacionRepository{db: database.GetDB()}
}

func (r *aprobacionRepository) Create(a *inventario.Aprobacion) error {
	return r.db.Create(a).Error
}

func (r *aprobacionRepository) FindByID(id uint) (*inventario.Aprobacion, error) {
	var m inventario.Aprobacion
	if err := r.db.Preload("Orden").Preload("DetalleOrden").Preload("User").First(&m, id).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *aprobacionRepository) FindByOrdenID(ordenID uint) ([]inventario.Aprobacion, error) {
	var list []inventario.Aprobacion
	if err := r.db.Where("orden_id = ?", ordenID).Preload("DetalleOrden").Preload("User").Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func (r *aprobacionRepository) FindByDetalleOrdenID(detalleOrdenID uint) ([]inventario.Aprobacion, error) {
	var list []inventario.Aprobacion
	if err := r.db.Where("detalle_orden_id = ?", detalleOrdenID).Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func (r *aprobacionRepository) ExisteAprobacionParaDetalle(detalleOrdenID uint) (bool, error) {
	var n int64
	err := r.db.Model(&inventario.Aprobacion{}).Where("detalle_orden_id = ?", detalleOrdenID).Count(&n).Error
	return n > 0, err
}
