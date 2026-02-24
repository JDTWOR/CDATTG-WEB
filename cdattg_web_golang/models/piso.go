package models

// Piso representa un piso de un bloque
type Piso struct {
	UserAuditModel
	Nombre   string `gorm:"size:100;not null" json:"nombre"`
	BloqueID uint   `gorm:"column:bloque_id;not null" json:"bloque_id"`
	
	// Relaciones
	Bloque    *Bloque    `gorm:"foreignKey:BloqueID" json:"bloque,omitempty"`
	Ambientes []Ambiente `gorm:"foreignKey:PisoID" json:"ambientes,omitempty"`
}

// TableName especifica el nombre de la tabla
func (Piso) TableName() string {
	return "pisos"
}
