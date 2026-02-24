package models

// TipoPrograma representa un tipo de programa
type TipoPrograma struct {
	BaseModel
	Nombre string `gorm:"size:255;not null" json:"nombre"`
	Codigo string `gorm:"size:50" json:"codigo"`
	Status bool   `gorm:"default:true" json:"status"`
	
	// Relaciones
	Programas []ProgramaFormacion `gorm:"foreignKey:TipoProgramaID" json:"programas,omitempty"`
}

// TableName especifica el nombre de la tabla
func (TipoPrograma) TableName() string {
	return "tipos_programa"
}
