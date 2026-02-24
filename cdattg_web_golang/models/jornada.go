package models

// Jornada representa una jornada de formación (mañana, tarde, etc.)
type Jornada struct {
	BaseModel
	Nombre     string `gorm:"size:100;not null" json:"nombre"`
	HoraInicio string `gorm:"column:hora_inicio;size:5" json:"hora_inicio"` // HH:MM
	HoraFin    string `gorm:"column:hora_fin;size:5" json:"hora_fin"`     // HH:MM
}

// TableName especifica el nombre de la tabla
func (Jornada) TableName() string {
	return "jornadas"
}
