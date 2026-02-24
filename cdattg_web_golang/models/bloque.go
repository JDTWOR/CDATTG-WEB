package models

// Bloque representa un bloque de infraestructura
type Bloque struct {
	UserAuditModel
	Nombre string `gorm:"size:100;not null" json:"nombre"`
	SedeID uint   `gorm:"column:sede_id;not null" json:"sede_id"`
	
	// Relaciones
	Sede  *Sede  `gorm:"foreignKey:SedeID" json:"sede,omitempty"`
	Pisos []Piso `gorm:"foreignKey:BloqueID" json:"pisos,omitempty"`
}

// TableName especifica el nombre de la tabla
func (Bloque) TableName() string {
	return "bloques"
}
