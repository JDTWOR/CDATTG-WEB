package complementarios

import "github.com/sena/cdattg-web-golang/models"

// CategoriaCaracterizacionComplementario representa una categoría de caracterización para complementarios
type CategoriaCaracterizacionComplementario struct {
	models.BaseModel
	Nombre   string `gorm:"size:255;not null" json:"nombre"`
	ParentID *uint  `gorm:"column:parent_id" json:"parent_id"`
	Status   bool   `gorm:"default:true" json:"status"`
	
	// Relaciones
	Parent   *CategoriaCaracterizacionComplementario `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
	Children []CategoriaCaracterizacionComplementario `gorm:"foreignKey:ParentID" json:"children,omitempty"`
}

// TableName especifica el nombre de la tabla
func (CategoriaCaracterizacionComplementario) TableName() string {
	return "categorias_caracterizacion_complementarios"
}
