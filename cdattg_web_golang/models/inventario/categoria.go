package inventario

import "github.com/sena/cdattg-web-golang/models"

// Categoria representa una categoría de productos (extiende Parametro)
type Categoria struct {
	models.BaseModel
	Name   string `gorm:"size:255;not null" json:"name"`
	Status bool   `gorm:"default:true" json:"status"`
	
	// Relaciones
	Productos []Producto `gorm:"foreignKey:CategoriaID" json:"productos,omitempty"`
}

// TableName especifica el nombre de la tabla
func (Categoria) TableName() string {
	return "categorias"
}
