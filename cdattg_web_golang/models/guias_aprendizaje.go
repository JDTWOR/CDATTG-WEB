package models

// GuiasAprendizaje representa una guía de aprendizaje
type GuiasAprendizaje struct {
	BaseModel
	Codigo      string `gorm:"size:50;not null" json:"codigo"`
	Nombre      string `gorm:"size:255;not null" json:"nombre"`
	Descripcion string `gorm:"type:text" json:"descripcion"`
	Duracion    *int   `json:"duracion"`
	Status      bool   `gorm:"default:true" json:"status"`
	
	// Relaciones
	ResultadosAprendizaje []ResultadosAprendizaje `gorm:"many2many:guia_aprendizaje_rap;foreignKey:ID;joinForeignKey:guia_aprendizaje_id;References:ID;joinReferences:rap_id" json:"resultados_aprendizaje,omitempty"`
	Evidencias []Evidencia `gorm:"many2many:evidencia_guia_aprendizaje;foreignKey:ID;joinForeignKey:guia_aprendizaje_id;References:ID;joinReferences:evidencia_id" json:"evidencias,omitempty"`
}

// TableName especifica el nombre de la tabla
func (GuiasAprendizaje) TableName() string {
	return "guias_aprendizaje"
}
