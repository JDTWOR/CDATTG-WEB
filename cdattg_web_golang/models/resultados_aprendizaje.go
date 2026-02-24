package models

// ResultadosAprendizaje representa un resultado de aprendizaje
type ResultadosAprendizaje struct {
	BaseModel
	Codigo   string  `gorm:"size:50;not null" json:"codigo"`
	Nombre   string  `gorm:"size:255;not null" json:"nombre"`
	Duracion float64 `gorm:"type:decimal(10,2)" json:"duracion"`
	Status   bool    `gorm:"default:true" json:"status"`
	
	// Relaciones
	Competencias []Competencia `gorm:"many2many:resultados_aprendizaje_competencia;foreignKey:ID;joinForeignKey:rap_id;References:ID;joinReferences:competencia_id" json:"competencias,omitempty"`
	GuiasAprendizaje []GuiasAprendizaje `gorm:"many2many:guia_aprendizaje_rap;foreignKey:ID;joinForeignKey:rap_id;References:ID;joinReferences:guia_aprendizaje_id" json:"guias_aprendizaje,omitempty"`
	Asignaciones []AsignacionInstructor `gorm:"many2many:asignacion_instructor_resultado;foreignKey:ID;joinForeignKey:resultado_aprendizaje_id;References:ID;joinReferences:asignacion_id" json:"asignaciones,omitempty"`
}

// TableName especifica el nombre de la tabla
func (ResultadosAprendizaje) TableName() string {
	return "resultados_aprendizajes"
}
