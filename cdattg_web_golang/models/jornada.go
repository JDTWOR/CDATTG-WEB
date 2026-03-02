package models

// Jornada representa una jornada de formación (mañana, tarde, etc.)
type Jornada struct {
	BaseModel
	Nombre               string `gorm:"size:100;not null" json:"nombre"`
	HoraInicio           string `gorm:"column:hora_inicio;size:5" json:"hora_inicio"`                       // HH:MM
	HoraFin              string `gorm:"column:hora_fin;size:5" json:"hora_fin"`                             // HH:MM
	MinutosExtensionFin  *int   `gorm:"column:minutos_extension_fin" json:"minutos_extension_fin,omitempty"` // Minutos después de hora_fin en que aún se permite registrar salida (clase a veces se extiende)
}

// TableName especifica el nombre de la tabla
func (Jornada) TableName() string {
	return "jornadas"
}
