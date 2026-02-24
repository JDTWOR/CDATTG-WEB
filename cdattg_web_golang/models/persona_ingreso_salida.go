package models

import "time"

// PersonaIngresoSalida representa el registro de ingreso y salida de personas por sede
type PersonaIngresoSalida struct {
	BaseModel
	PersonaID            uint       `gorm:"column:persona_id;not null" json:"persona_id"`
	SedeID               uint       `gorm:"column:sede_id;not null" json:"sede_id"`
	TipoPersona          string     `gorm:"size:50;not null" json:"tipo_persona"`
	FechaEntrada         time.Time  `gorm:"column:fecha_entrada;not null" json:"fecha_entrada"`
	HoraEntrada          time.Time  `gorm:"column:hora_entrada;not null" json:"hora_entrada"`
	TimestampEntrada     time.Time  `gorm:"column:timestamp_entrada;not null" json:"timestamp_entrada"`
	FechaSalida          *time.Time `gorm:"column:fecha_salida" json:"fecha_salida"`
	HoraSalida           *time.Time `gorm:"column:hora_salida" json:"hora_salida"`
	TimestampSalida      *time.Time `gorm:"column:timestamp_salida" json:"timestamp_salida"`
	AmbienteID           *uint      `gorm:"column:ambiente_id" json:"ambiente_id"`
	FichaCaracterizacionID *uint    `gorm:"column:ficha_caracterizacion_id" json:"ficha_caracterizacion_id"`
	Observaciones        string     `gorm:"type:text" json:"observaciones"`
	
	// Relaciones
	Persona            *Persona            `gorm:"foreignKey:PersonaID" json:"persona,omitempty"`
	Sede               *Sede               `gorm:"foreignKey:SedeID" json:"sede,omitempty"`
	Ambiente           *Ambiente           `gorm:"foreignKey:AmbienteID" json:"ambiente,omitempty"`
	FichaCaracterizacion *FichaCaracterizacion `gorm:"foreignKey:FichaCaracterizacionID" json:"ficha_caracterizacion,omitempty"`
}

// TableName especifica el nombre de la tabla
func (PersonaIngresoSalida) TableName() string {
	return "persona_ingreso_salida"
}
