package models

// Pais representa un país
type Pais struct {
	BaseModel
	Nombre string `gorm:"size:100;not null" json:"nombre"`
	Codigo string `gorm:"size:10" json:"codigo"`
	
	// Relaciones
	Departamentos []Departamento `gorm:"foreignKey:PaisID" json:"departamentos,omitempty"`
	Personas      []Persona      `gorm:"foreignKey:PaisID" json:"personas,omitempty"`
}

// TableName especifica el nombre de la tabla
func (Pais) TableName() string {
	return "paises"
}
