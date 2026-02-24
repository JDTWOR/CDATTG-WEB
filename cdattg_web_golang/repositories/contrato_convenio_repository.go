package repositories

import (
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models/inventario"
	"gorm.io/gorm"
)

type ContratoConvenioRepository interface {
	Create(c *inventario.ContratoConvenio) error
	Update(c *inventario.ContratoConvenio) error
	FindByID(id uint) (*inventario.ContratoConvenio, error)
	FindAll(limit, offset int) ([]inventario.ContratoConvenio, int64, error)
	Delete(c *inventario.ContratoConvenio) error
	CountProductos(contratoID uint) (int64, error)
}

type contratoConvenioRepository struct {
	db *gorm.DB
}

func NewContratoConvenioRepository() ContratoConvenioRepository {
	return &contratoConvenioRepository{db: database.GetDB()}
}

func (r *contratoConvenioRepository) Create(c *inventario.ContratoConvenio) error {
	return r.db.Create(c).Error
}

func (r *contratoConvenioRepository) Update(c *inventario.ContratoConvenio) error {
	return r.db.Save(c).Error
}

func (r *contratoConvenioRepository) FindByID(id uint) (*inventario.ContratoConvenio, error) {
	var m inventario.ContratoConvenio
	if err := r.db.First(&m, id).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *contratoConvenioRepository) FindAll(limit, offset int) ([]inventario.ContratoConvenio, int64, error) {
	var total int64
	if err := r.db.Model(&inventario.ContratoConvenio{}).Where("status = ?", true).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var list []inventario.ContratoConvenio
	if err := r.db.Where("status = ?", true).Limit(limit).Offset(offset).Order("nombre").Find(&list).Error; err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func (r *contratoConvenioRepository) Delete(c *inventario.ContratoConvenio) error {
	return r.db.Delete(c).Error
}

func (r *contratoConvenioRepository) CountProductos(contratoID uint) (int64, error) {
	var n int64
	err := r.db.Model(&inventario.Producto{}).Where("contrato_convenio_id = ?", contratoID).Count(&n).Error
	return n, err
}
