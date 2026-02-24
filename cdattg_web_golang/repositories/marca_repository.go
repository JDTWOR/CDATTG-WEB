package repositories

import (
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models/inventario"
	"gorm.io/gorm"
)

type MarcaRepository interface {
	Create(m *inventario.Marca) error
	Update(m *inventario.Marca) error
	FindByID(id uint) (*inventario.Marca, error)
	FindAll() ([]inventario.Marca, error)
	Delete(m *inventario.Marca) error
	CountProductos(marcaID uint) (int64, error)
}

type marcaRepository struct {
	db *gorm.DB
}

func NewMarcaRepository() MarcaRepository {
	return &marcaRepository{db: database.GetDB()}
}

func (r *marcaRepository) Create(m *inventario.Marca) error {
	return r.db.Create(m).Error
}

func (r *marcaRepository) Update(m *inventario.Marca) error {
	return r.db.Save(m).Error
}

func (r *marcaRepository) FindByID(id uint) (*inventario.Marca, error) {
	var ent inventario.Marca
	if err := r.db.First(&ent, id).Error; err != nil {
		return nil, err
	}
	return &ent, nil
}

func (r *marcaRepository) FindAll() ([]inventario.Marca, error) {
	var list []inventario.Marca
	if err := r.db.Where("status = ?", true).Order("name").Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func (r *marcaRepository) Delete(m *inventario.Marca) error {
	return r.db.Delete(m).Error
}

func (r *marcaRepository) CountProductos(marcaID uint) (int64, error) {
	var n int64
	err := r.db.Model(&inventario.Producto{}).Where("marca_id = ?", marcaID).Count(&n).Error
	return n, err
}
