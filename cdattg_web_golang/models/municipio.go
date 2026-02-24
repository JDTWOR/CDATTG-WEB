package models

// Municipio representa un municipio
type Municipio struct {
	BaseModel
	Nombre        string `gorm:"size:100;not null" json:"nombre"`
	DepartamentoID *uint `gorm:"column:departamento_id" json:"departamento_id"`
	
	// Relaciones
	Departamento *Departamento `gorm:"foreignKey:DepartamentoID" json:"departamento,omitempty"`
	Personas    []Persona     `gorm:"foreignKey:MunicipioID" json:"personas,omitempty"`
	Sedes       []Sede        `gorm:"foreignKey:MunicipioID" json:"sedes,omitempty"`
}

// TableName especifica el nombre de la tabla
func (Municipio) TableName() string {
	return "municipios"
}
