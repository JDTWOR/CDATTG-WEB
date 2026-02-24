package repositories

import (
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models/inventario"
	"gorm.io/gorm"
)

type ProductoRepository interface {
	Create(p *inventario.Producto) error
	Update(p *inventario.Producto) error
	FindByID(id uint) (*inventario.Producto, error)
	FindAll(limit, offset int) ([]inventario.Producto, int64, error)
	FindByName(name string) (*inventario.Producto, error)
	FindByCodigoBarras(codigo string) (*inventario.Producto, error)
	Delete(p *inventario.Producto) error
	CountByCategoriaID(categoriaID uint) (int64, error)
	CountByMarcaID(marcaID uint) (int64, error)
	CountByProveedorID(proveedorID uint) (int64, error)
	CountByContratoConvenioID(contratoID uint) (int64, error)
	CountTotal() (int64, error)
	CountStockBajo(umbralMinimo int) (int64, error)
	CountStockCritico(umbralCritico int) (int64, error)
}

type productoRepository struct {
	db *gorm.DB
}

func NewProductoRepository() ProductoRepository {
	return &productoRepository{db: database.GetDB()}
}

func (r *productoRepository) Create(p *inventario.Producto) error {
	return r.db.Create(p).Error
}

func (r *productoRepository) Update(p *inventario.Producto) error {
	return r.db.Save(p).Error
}

func (r *productoRepository) FindByID(id uint) (*inventario.Producto, error) {
	var m inventario.Producto
	if err := r.db.First(&m, id).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *productoRepository) FindAll(limit, offset int) ([]inventario.Producto, int64, error) {
	var list []inventario.Producto
	var total int64
	if err := r.db.Model(&inventario.Producto{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if err := r.db.Limit(limit).Offset(offset).Order("name").Find(&list).Error; err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func (r *productoRepository) FindByName(name string) (*inventario.Producto, error) {
	var m inventario.Producto
	if err := r.db.Where("name = ?", name).First(&m).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *productoRepository) FindByCodigoBarras(codigo string) (*inventario.Producto, error) {
	if codigo == "" {
		return nil, gorm.ErrRecordNotFound
	}
	var m inventario.Producto
	if err := r.db.Where("codigo_barras = ?", codigo).First(&m).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *productoRepository) Delete(p *inventario.Producto) error {
	return r.db.Delete(p).Error
}

func (r *productoRepository) CountByCategoriaID(categoriaID uint) (int64, error) {
	var n int64
	err := r.db.Model(&inventario.Producto{}).Where("categoria_id = ?", categoriaID).Count(&n).Error
	return n, err
}

func (r *productoRepository) CountByMarcaID(marcaID uint) (int64, error) {
	var n int64
	err := r.db.Model(&inventario.Producto{}).Where("marca_id = ?", marcaID).Count(&n).Error
	return n, err
}

func (r *productoRepository) CountByProveedorID(proveedorID uint) (int64, error) {
	var n int64
	err := r.db.Model(&inventario.Producto{}).Where("proveedor_id = ?", proveedorID).Count(&n).Error
	return n, err
}

func (r *productoRepository) CountByContratoConvenioID(contratoID uint) (int64, error) {
	var n int64
	err := r.db.Model(&inventario.Producto{}).Where("contrato_convenio_id = ?", contratoID).Count(&n).Error
	return n, err
}

func (r *productoRepository) CountTotal() (int64, error) {
	var n int64
	err := r.db.Model(&inventario.Producto{}).Count(&n).Error
	return n, err
}

func (r *productoRepository) CountStockBajo(umbralMinimo int) (int64, error) {
	var n int64
	err := r.db.Model(&inventario.Producto{}).Where("COALESCE(cantidad, 0) < ? AND COALESCE(cantidad, 0) >= 0", umbralMinimo).Count(&n).Error
	return n, err
}

func (r *productoRepository) CountStockCritico(umbralCritico int) (int64, error) {
	var n int64
	err := r.db.Model(&inventario.Producto{}).Where("COALESCE(cantidad, 0) < ? AND COALESCE(cantidad, 0) >= 0", umbralCritico).Count(&n).Error
	return n, err
}
