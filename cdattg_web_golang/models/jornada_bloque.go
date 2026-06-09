package models

// JornadaBloque define un bloque horario de una plantilla de jornada (día + rango).
type JornadaBloque struct {
	BaseModel
	JornadaID      uint   `gorm:"column:jornada_id;not null;index" json:"jornada_id"`
	DiaFormacionID uint   `gorm:"column:dia_formacion_id;not null" json:"dia_formacion_id"`
	HoraInicio     string `gorm:"column:hora_inicio;size:5;not null" json:"hora_inicio"`
	HoraFin        string `gorm:"column:hora_fin;size:5;not null" json:"hora_fin"`
	Orden          int    `gorm:"column:orden;default:0" json:"orden"`

	Jornada      *Jornada      `gorm:"foreignKey:JornadaID" json:"jornada,omitempty"`
	DiaFormacion *DiasFormacion `gorm:"foreignKey:DiaFormacionID" json:"dia_formacion,omitempty"`
}

func (JornadaBloque) TableName() string {
	return "jornada_bloques"
}
