package models

// ResultadosCompetencia representa la relación entre resultados de aprendizaje y competencias
type ResultadosCompetencia struct {
	BaseModel
	RapID         uint    `gorm:"column:rap_id;not null" json:"rap_id"`
	CompetenciaID uint    `gorm:"column:competencia_id;not null" json:"competencia_id"`
	Duracion      *float64 `gorm:"type:decimal(10,2)" json:"duracion"`
	
	// Relaciones
	Rap         *ResultadosAprendizaje `gorm:"foreignKey:RapID" json:"rap,omitempty"`
	Competencia *Competencia           `gorm:"foreignKey:CompetenciaID" json:"competencia,omitempty"`
}

// TableName especifica el nombre de la tabla
func (ResultadosCompetencia) TableName() string {
	return "resultados_aprendizaje_competencia"
}
