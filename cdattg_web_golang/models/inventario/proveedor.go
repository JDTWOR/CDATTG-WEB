package inventario

import "github.com/sena/cdattg-web-golang/models"

// Proveedor representa un proveedor
type Proveedor struct {
	models.UserAuditModel
	Name        string `gorm:"size:255;not null" json:"name"`
	NIT         string `gorm:"size:50;uniqueIndex" json:"nit"`
	PersonaID   *uint  `gorm:"column:persona_id" json:"persona_id"`
	PaisID      *uint  `gorm:"column:pais_id" json:"pais_id"`
	Direccion   string `gorm:"size:255" json:"direccion"`
	Telefono    string `gorm:"size:20" json:"telefono"`
	Email       string `gorm:"size:100" json:"email"`
	Status      bool   `gorm:"default:true" json:"status"`
	
	// Relaciones
	// Persona        *models.Persona `gorm:"foreignKey:PersonaID" json:"persona,omitempty"`
	// Pais           *models.Pais    `gorm:"foreignKey:PaisID" json:"pais,omitempty"`
	// Productos      []Producto      `gorm:"foreignKey:ProveedorID" json:"productos,omitempty"`
	// Contactos      []ProveedorContacto `gorm:"foreignKey:ProveedorID" json:"contactos,omitempty"`
}

// TableName especifica el nombre de la tabla
func (Proveedor) TableName() string {
	return "proveedores"
}
