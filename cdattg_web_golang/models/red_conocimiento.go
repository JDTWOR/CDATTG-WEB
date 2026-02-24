package models

// RedConocimiento representa una red de conocimiento
type RedConocimiento struct {
	BaseModel
	Nombre    string `gorm:"size:255;not null" json:"nombre"`
	RegionalID *uint `gorm:"column:regionals_id" json:"regionals_id"`
	
	// Relaciones
	Programas []ProgramaFormacion `gorm:"foreignKey:RedConocimientoID" json:"programas,omitempty"`
}

// TableName especifica el nombre de la tabla
func (RedConocimiento) TableName() string {
	return "redes_conocimiento"
}
