package inventario

import "github.com/sena/cdattg-web-golang/models"

// Marca representa una marca de productos (extiende Parametro)
type Marca struct {
	models.BaseModel
	Name   string `gorm:"size:255;not null" json:"name"`
	Status bool   `gorm:"default:true" json:"status"`
	
	// Relaciones
	Productos []Producto `gorm:"foreignKey:MarcaID" json:"productos,omitempty"`
}

// TableName especifica el nombre de la tabla
func (Marca) TableName() string {
	return "marcas"
}
