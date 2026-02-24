package models

import "time"

// EntradaSalida representa el registro de entrada y salida de personas
type EntradaSalida struct {
	BaseModel
	PersonaID      uint       `gorm:"column:persona_id;not null" json:"persona_id"`
	SedeID         uint       `gorm:"column:sede_id;not null" json:"sede_id"`
	TipoPersona    string     `gorm:"size:50;not null" json:"tipo_persona"` // INSTRUCTOR, APRENDIZ, VISITANTE
	FechaEntrada   time.Time  `gorm:"column:fecha_entrada;not null" json:"fecha_entrada"`
	HoraEntrada    time.Time  `gorm:"column:hora_entrada;not null" json:"hora_entrada"`
	FechaSalida    *time.Time `gorm:"column:fecha_salida" json:"fecha_salida"`
	HoraSalida     *time.Time `gorm:"column:hora_salida" json:"hora_salida"`
	Observaciones  string     `gorm:"type:text" json:"observaciones"`
	
	// Relaciones
	Persona *Persona `gorm:"foreignKey:PersonaID" json:"persona,omitempty"`
	Sede    *Sede    `gorm:"foreignKey:SedeID" json:"sede,omitempty"`
}

// TableName especifica el nombre de la tabla
func (EntradaSalida) TableName() string {
	return "entrada_salida"
}
