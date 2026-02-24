package models

// FichaDiasFormacion representa la relación entre fichas y días de formación
type FichaDiasFormacion struct {
	BaseModel
	FichaID         uint `gorm:"column:ficha_id;not null" json:"ficha_id"`
	DiaFormacionID  uint `gorm:"column:dia_formacion_id;not null" json:"dia_formacion_id"`
	HoraInicio      string `gorm:"size:10" json:"hora_inicio"`
	HoraFin         string `gorm:"size:10" json:"hora_fin"`
	
	// Relaciones
	Ficha        *FichaCaracterizacion `gorm:"foreignKey:FichaID" json:"ficha,omitempty"`
	DiaFormacion *DiasFormacion        `gorm:"foreignKey:DiaFormacionID" json:"dia_formacion,omitempty"`
}

// TableName especifica el nombre de la tabla
func (FichaDiasFormacion) TableName() string {
	return "ficha_dias_formacion"
}
