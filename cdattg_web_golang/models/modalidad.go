package models

// Modalidad representa una modalidad (para complementarios: presencial, virtual, etc.)
type Modalidad struct {
	BaseModel
	Nombre string `gorm:"size:100;not null" json:"nombre"`
}

// TableName especifica el nombre de la tabla
func (Modalidad) TableName() string {
	return "modalidades"
}
