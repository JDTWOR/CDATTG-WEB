package repositories

import (
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models/inventario"
	"gorm.io/gorm"
)

type ProveedorRepository interface {
	Create(p *inventario.Proveedor) error
	Update(p *inventario.Proveedor) error
	FindByID(id uint) (*inventario.Proveedor, error)
	FindAll(limit, offset int) ([]inventario.Proveedor, int64, error)
	FindByNIT(nit string) (*inventario.Proveedor, error)
	Delete(p *inventario.Proveedor) error
	CountProductos(proveedorID uint) (int64, error)
	CountContratos(proveedorID uint) (int64, error)
}

type proveedorRepository struct {
	db *gorm.DB
}

func NewProveedorRepository() ProveedorRepository {
	return &proveedorRepository{db: database.GetDB()}
}

func (r *proveedorRepository) Create(p *inventario.Proveedor) error {
	return r.db.Create(p).Error
}

func (r *proveedorRepository) Update(p *inventario.Proveedor) error {
	return r.db.Save(p).Error
}

func (r *proveedorRepository) FindByID(id uint) (*inventario.Proveedor, error) {
	var m inventario.Proveedor
	if err := r.db.First(&m, id).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *proveedorRepository) FindAll(limit, offset int) ([]inventario.Proveedor, int64, error) {
	var total int64
	if err := r.db.Model(&inventario.Proveedor{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var list []inventario.Proveedor
	if err := r.db.Limit(limit).Offset(offset).Where("status = ?", true).Order("name").Find(&list).Error; err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func (r *proveedorRepository) FindByNIT(nit string) (*inventario.Proveedor, error) {
	var m inventario.Proveedor
	if err := r.db.Where("nit = ?", nit).First(&m).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *proveedorRepository) Delete(p *inventario.Proveedor) error {
	return r.db.Delete(p).Error
}

func (r *proveedorRepository) CountProductos(proveedorID uint) (int64, error) {
	var n int64
	err := r.db.Model(&inventario.Producto{}).Where("proveedor_id = ?", proveedorID).Count(&n).Error
	return n, err
}

func (r *proveedorRepository) CountContratos(proveedorID uint) (int64, error) {
	// ContratoConvenio no tiene proveedor_id en el modelo actual; si se agrega, descomentar
	var n int64
	_ = proveedorID
	err := r.db.Model(&inventario.ContratoConvenio{}).Count(&n).Error
	return n, err
}
