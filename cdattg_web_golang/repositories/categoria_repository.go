package repositories

import (
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models/inventario"
	"gorm.io/gorm"
)

type CategoriaRepository interface {
	Create(c *inventario.Categoria) error
	Update(c *inventario.Categoria) error
	FindByID(id uint) (*inventario.Categoria, error)
	FindAll() ([]inventario.Categoria, error)
	Delete(c *inventario.Categoria) error
	CountProductos(categoriaID uint) (int64, error)
}

type categoriaRepository struct {
	db *gorm.DB
}

func NewCategoriaRepository() CategoriaRepository {
	return &categoriaRepository{db: database.GetDB()}
}

func (r *categoriaRepository) Create(c *inventario.Categoria) error {
	return r.db.Create(c).Error
}

func (r *categoriaRepository) Update(c *inventario.Categoria) error {
	return r.db.Save(c).Error
}

func (r *categoriaRepository) FindByID(id uint) (*inventario.Categoria, error) {
	var m inventario.Categoria
	if err := r.db.First(&m, id).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *categoriaRepository) FindAll() ([]inventario.Categoria, error) {
	var list []inventario.Categoria
	if err := r.db.Where("status = ?", true).Order("name").Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func (r *categoriaRepository) Delete(c *inventario.Categoria) error {
	return r.db.Delete(c).Error
}

func (r *categoriaRepository) CountProductos(categoriaID uint) (int64, error) {
	var n int64
	err := r.db.Model(&inventario.Producto{}).Where("categoria_id = ?", categoriaID).Count(&n).Error
	return n, err
}
