package models

// GuiaAprendizajeRap representa la relación entre guías de aprendizaje y resultados de aprendizaje
type GuiaAprendizajeRap struct {
	BaseModel
	GuiaAprendizajeID uint `gorm:"column:guia_aprendizaje_id;not null" json:"guia_aprendizaje_id"`
	RapID             uint `gorm:"column:rap_id;not null" json:"rap_id"`
	
	// Relaciones
	GuiaAprendizaje *GuiasAprendizaje `gorm:"foreignKey:GuiaAprendizajeID" json:"guia_aprendizaje,omitempty"`
	Rap             *ResultadosAprendizaje `gorm:"foreignKey:RapID" json:"rap,omitempty"`
}

// TableName especifica el nombre de la tabla
func (GuiaAprendizajeRap) TableName() string {
	return "guia_aprendizaje_rap"
}
