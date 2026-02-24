package repositories

import (
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models/inventario"
	"gorm.io/gorm"
)

type DevolucionRepository interface {
	Create(d *inventario.Devolucion) error
	FindByID(id uint) (*inventario.Devolucion, error)
	FindByDetalleOrdenID(detalleOrdenID uint) ([]inventario.Devolucion, error)
	ExisteCierreSinStock(detalleOrdenID uint) (bool, error)
}

type devolucionRepository struct {
	db *gorm.DB
}

func NewDevolucionRepository() DevolucionRepository {
	return &devolucionRepository{db: database.GetDB()}
}

func (r *devolucionRepository) Create(d *inventario.Devolucion) error {
	return r.db.Create(d).Error
}

func (r *devolucionRepository) FindByID(id uint) (*inventario.Devolucion, error) {
	var m inventario.Devolucion
	if err := r.db.Preload("DetalleOrden").Preload("DetalleOrden.Producto").Preload("DetalleOrden.Orden").First(&m, id).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *devolucionRepository) FindByDetalleOrdenID(detalleOrdenID uint) ([]inventario.Devolucion, error) {
	var list []inventario.Devolucion
	if err := r.db.Where("detalle_orden_id = ?", detalleOrdenID).Order("fecha_devolucion DESC").Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func (r *devolucionRepository) ExisteCierreSinStock(detalleOrdenID uint) (bool, error) {
	var n int64
	err := r.db.Model(&inventario.Devolucion{}).Where("detalle_orden_id = ? AND cierra_sin_stock = ?", detalleOrdenID, true).Count(&n).Error
	return n > 0, err
}
