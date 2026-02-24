package models

// CompetenciaPrograma representa la relación entre competencias y programas
type CompetenciaPrograma struct {
	BaseModel
	ProgramaID   uint `gorm:"column:programa_id;not null" json:"programa_id"`
	CompetenciaID uint `gorm:"column:competencia_id;not null" json:"competencia_id"`
	
	// Relaciones
	Programa   *ProgramaFormacion `gorm:"foreignKey:ProgramaID" json:"programa,omitempty"`
	Competencia *Competencia      `gorm:"foreignKey:CompetenciaID" json:"competencia,omitempty"`
}

// TableName especifica el nombre de la tabla
func (CompetenciaPrograma) TableName() string {
	return "competencia_programa"
}
