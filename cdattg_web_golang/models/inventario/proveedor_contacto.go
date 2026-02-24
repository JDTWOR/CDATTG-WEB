package inventario

import "github.com/sena/cdattg-web-golang/models"

// ProveedorContacto representa un contacto de proveedor
type ProveedorContacto struct {
	models.BaseModel
	ProveedorID uint   `gorm:"column:proveedor_id;not null" json:"proveedor_id"`
	Nombre      string `gorm:"size:255;not null" json:"nombre"`
	Cargo       string `gorm:"size:100" json:"cargo"`
	Telefono    string `gorm:"size:20" json:"telefono"`
	Celular     string `gorm:"size:20" json:"celular"`
	Email       string `gorm:"size:100" json:"email"`
	
	// Relaciones
	Proveedor *Proveedor `gorm:"foreignKey:ProveedorID" json:"proveedor,omitempty"`
}

// TableName especifica el nombre de la tabla
func (ProveedorContacto) TableName() string {
	return "proveedor_contactos"
}
