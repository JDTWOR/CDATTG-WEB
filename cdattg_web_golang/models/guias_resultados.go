package models

// GuiasResultados representa la relación entre guías y resultados
type GuiasResultados struct {
	BaseModel
	GuiaAprendizajeID uint `gorm:"column:guia_aprendizaje_id;not null" json:"guia_aprendizaje_id"`
	ResultadoID       uint `gorm:"column:resultado_id;not null" json:"resultado_id"`
	
	// Relaciones
	GuiaAprendizaje *GuiasAprendizaje `gorm:"foreignKey:GuiaAprendizajeID" json:"guia_aprendizaje,omitempty"`
	Resultado       *ResultadosAprendizaje `gorm:"foreignKey:ResultadoID" json:"resultado,omitempty"`
}

// TableName especifica el nombre de la tabla
func (GuiasResultados) TableName() string {
	return "guias_resultados"
}
