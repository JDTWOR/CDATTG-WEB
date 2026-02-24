package models

import "time"

// Competencia representa una competencia
type Competencia struct {
	BaseModel
	Codigo      string     `gorm:"size:50;not null" json:"codigo"`
	Nombre      string     `gorm:"size:255;not null" json:"nombre"`
	FechaInicio *time.Time `gorm:"column:fecha_inicio" json:"fecha_inicio"`
	FechaFin    *time.Time `gorm:"column:fecha_fin" json:"fecha_fin"`
	Status      bool       `gorm:"default:true" json:"status"`
	
	// Relaciones
	Programas []ProgramaFormacion `gorm:"many2many:competencia_programa;foreignKey:ID;joinForeignKey:competencia_id;References:ID;joinReferences:programa_id" json:"programas,omitempty"`
	ResultadosAprendizaje []ResultadosAprendizaje `gorm:"many2many:resultados_aprendizaje_competencia;foreignKey:ID;joinForeignKey:competencia_id;References:ID;joinReferences:rap_id" json:"resultados_aprendizaje,omitempty"`
}

// TableName especifica el nombre de la tabla
func (Competencia) TableName() string {
	return "competencias"
}
