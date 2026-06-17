package models

import "time"

// DiaSinFormacionSede marca rangos sin formación por sede (PARO, etc.).
type DiaSinFormacionSede struct {
	BaseModel
	SedeID       uint      `gorm:"column:sede_id;not null;index" json:"sede_id"`
	FechaInicio  time.Time `gorm:"column:fecha_inicio;type:date;not null" json:"fecha_inicio"`
	FechaFin     time.Time `gorm:"column:fecha_fin;type:date;not null" json:"fecha_fin"`
	Motivo       string    `gorm:"size:255;not null" json:"motivo"`
	ActorUserID  *uint     `gorm:"column:actor_user_id" json:"actor_user_id,omitempty"`
	Sede         *Sede     `gorm:"foreignKey:SedeID" json:"sede,omitempty"`
}

func (DiaSinFormacionSede) TableName() string {
	return "dias_sin_formacion_sede"
}
