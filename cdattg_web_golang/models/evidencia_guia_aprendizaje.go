package models

// EvidenciaGuiaAprendizaje representa la relación entre evidencias y guías de aprendizaje
type EvidenciaGuiaAprendizaje struct {
	BaseModel
	EvidenciaID      uint `gorm:"column:evidencia_id;not null" json:"evidencia_id"`
	GuiaAprendizajeID uint `gorm:"column:guia_aprendizaje_id;not null" json:"guia_aprendizaje_id"`
	
	// Relaciones
	Evidencia      *Evidencia      `gorm:"foreignKey:EvidenciaID" json:"evidencia,omitempty"`
	GuiaAprendizaje *GuiasAprendizaje `gorm:"foreignKey:GuiaAprendizajeID" json:"guia_aprendizaje,omitempty"`
}

// TableName especifica el nombre de la tabla
func (EvidenciaGuiaAprendizaje) TableName() string {
	return "evidencia_guia_aprendizaje"
}
