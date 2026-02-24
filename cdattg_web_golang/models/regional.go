package models

// Regional representa una regional del SENA
type Regional struct {
	BaseModel
	Nombre string `gorm:"size:100;not null" json:"nombre"`
	Codigo string `gorm:"size:50" json:"codigo"`
	
	// Relaciones
	Sedes       []Sede      `gorm:"foreignKey:RegionalID" json:"sedes,omitempty"`
	Instructores []Instructor `gorm:"foreignKey:RegionalID" json:"instructores,omitempty"`
}

// TableName especifica el nombre de la tabla
func (Regional) TableName() string {
	return "regionals"
}
