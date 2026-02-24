package repositories

import (
	"fmt"

	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models/inventario"
	"gorm.io/gorm"
)

type OrdenRepository interface {
	Create(o *inventario.Orden) error
	Update(o *inventario.Orden) error
	FindByID(id uint) (*inventario.Orden, error)
	FindByNumero(numero string) (*inventario.Orden, error)
	FindAll(limit, offset int, userID *uint, verTodas bool) ([]inventario.Orden, int64, error)
	FindPendientesAprobacion(limit, offset int) ([]inventario.Orden, int64, error)
	NextNumeroOrden() (string, error)
	CountEnEspera() (int64, error)
	CountHoy() (int64, error)
}

type DetalleOrdenRepository interface {
	Create(d *inventario.DetalleOrden) error
	CreateBatch(detalles []inventario.DetalleOrden) error
	Update(d *inventario.DetalleOrden) error
	FindByID(id uint) (*inventario.DetalleOrden, error)
	FindByOrdenID(ordenID uint) ([]inventario.DetalleOrden, error)
	FindEnEsperaByOrdenID(ordenID uint) ([]inventario.DetalleOrden, error)
}

type ordenRepository struct {
	db *gorm.DB
}

func NewOrdenRepository() OrdenRepository {
	return &ordenRepository{db: database.GetDB()}
}

func (r *ordenRepository) Create(o *inventario.Orden) error {
	return r.db.Create(o).Error
}

func (r *ordenRepository) Update(o *inventario.Orden) error {
	return r.db.Save(o).Error
}

func (r *ordenRepository) FindByID(id uint) (*inventario.Orden, error) {
	var m inventario.Orden
	if err := r.db.Preload("DetalleOrdenes").Preload("DetalleOrdenes.Producto").Preload("Persona").Preload("Ambiente").
		First(&m, id).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *ordenRepository) FindByNumero(numero string) (*inventario.Orden, error) {
	var m inventario.Orden
	if err := r.db.Where("numero_orden = ?", numero).First(&m).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *ordenRepository) FindAll(limit, offset int, userID *uint, verTodas bool) ([]inventario.Orden, int64, error) {
	q := r.db.Model(&inventario.Orden{})
	if !verTodas && userID != nil {
		q = q.Where("user_create_id = ?", *userID)
	}
	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var list []inventario.Orden
	if err := r.db.Scopes(func(db *gorm.DB) *gorm.DB {
		if !verTodas && userID != nil {
			return db.Where("user_create_id = ?", *userID)
		}
		return db
	}).Preload("DetalleOrdenes").Preload("DetalleOrdenes.Producto").Preload("Persona").
		Limit(limit).Offset(offset).Order("fecha_orden DESC").Find(&list).Error; err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func (r *ordenRepository) FindPendientesAprobacion(limit, offset int) ([]inventario.Orden, int64, error) {
	var total int64
	if err := r.db.Model(&inventario.Orden{}).Where("estado = ?", inventario.OrdenEstadoEnEspera).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var list []inventario.Orden
	if err := r.db.Where("estado = ?", inventario.OrdenEstadoEnEspera).
		Preload("DetalleOrdenes", "estado = ?", inventario.DetalleEstadoEnEspera).
		Preload("DetalleOrdenes.Producto").Preload("Persona").
		Limit(limit).Offset(offset).Order("fecha_orden ASC").Find(&list).Error; err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func (r *ordenRepository) NextNumeroOrden() (string, error) {
	var last inventario.Orden
	err := r.db.Order("id DESC").First(&last).Error
	if err == gorm.ErrRecordNotFound {
		return "ORD-1", nil
	}
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("ORD-%d", last.ID+1), nil
}

func (r *ordenRepository) CountEnEspera() (int64, error) {
	var n int64
	err := r.db.Model(&inventario.Orden{}).Where("estado = ?", inventario.OrdenEstadoEnEspera).Count(&n).Error
	return n, err
}

func (r *ordenRepository) CountHoy() (int64, error) {
	var n int64
	err := r.db.Model(&inventario.Orden{}).Where("DATE(fecha_orden) = CURRENT_DATE").Count(&n).Error
	return n, err
}

type detalleOrdenRepository struct {
	db *gorm.DB
}

func NewDetalleOrdenRepository() DetalleOrdenRepository {
	return &detalleOrdenRepository{db: database.GetDB()}
}

func (r *detalleOrdenRepository) Create(d *inventario.DetalleOrden) error {
	return r.db.Create(d).Error
}

func (r *detalleOrdenRepository) CreateBatch(detalles []inventario.DetalleOrden) error {
	if len(detalles) == 0 {
		return nil
	}
	return r.db.Create(&detalles).Error
}

func (r *detalleOrdenRepository) Update(d *inventario.DetalleOrden) error {
	return r.db.Save(d).Error
}

func (r *detalleOrdenRepository) FindByID(id uint) (*inventario.DetalleOrden, error) {
	var m inventario.DetalleOrden
	if err := r.db.Preload("Producto").Preload("Orden").First(&m, id).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *detalleOrdenRepository) FindByOrdenID(ordenID uint) ([]inventario.DetalleOrden, error) {
	var list []inventario.DetalleOrden
	if err := r.db.Where("orden_id = ?", ordenID).Preload("Producto").Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func (r *detalleOrdenRepository) FindEnEsperaByOrdenID(ordenID uint) ([]inventario.DetalleOrden, error) {
	var list []inventario.DetalleOrden
	if err := r.db.Where("orden_id = ? AND estado = ?", ordenID, inventario.DetalleEstadoEnEspera).Preload("Producto").Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}
