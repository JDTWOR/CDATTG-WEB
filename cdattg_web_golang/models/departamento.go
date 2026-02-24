package models

// Departamento representa un departamento
type Departamento struct {
	BaseModel
	Nombre string `gorm:"size:100;not null" json:"nombre"`
	PaisID *uint  `gorm:"column:pais_id" json:"pais_id"`
	
	// Relaciones
	Pais        *Pais       `gorm:"foreignKey:PaisID" json:"pais,omitempty"`
	Municipios  []Municipio `gorm:"foreignKey:DepartamentoID" json:"municipios,omitempty"`
	Personas    []Persona   `gorm:"foreignKey:DepartamentoID" json:"personas,omitempty"`
}

// TableName especifica el nombre de la tabla
func (Departamento) TableName() string {
	return "departamentos"
}
