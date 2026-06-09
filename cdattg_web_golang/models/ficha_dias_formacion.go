package models

// FichaDiasFormacion representa un bloque horario de formación de una ficha (puede haber varios por día).
type FichaDiasFormacion struct {
	BaseModel
	FichaID        uint   `gorm:"column:ficha_id;not null;index" json:"ficha_id"`
	DiaFormacionID uint   `gorm:"column:dia_formacion_id;not null" json:"dia_formacion_id"`
	HoraInicio     string `gorm:"size:10" json:"hora_inicio"`
	HoraFin        string `gorm:"size:10" json:"hora_fin"`
	Orden          int    `gorm:"column:orden;default:0" json:"orden"`
	JornadaID      *uint  `gorm:"column:jornada_id" json:"jornada_id,omitempty"`

	Ficha        *FichaCaracterizacion `gorm:"foreignKey:FichaID" json:"ficha,omitempty"`
	DiaFormacion *DiasFormacion        `gorm:"foreignKey:DiaFormacionID" json:"dia_formacion,omitempty"`
	Jornada      *Jornada              `gorm:"foreignKey:JornadaID" json:"jornada,omitempty"`
}

// TableName especifica el nombre de la tabla
func (FichaDiasFormacion) TableName() string {
	return "ficha_dias_formacion"
}
