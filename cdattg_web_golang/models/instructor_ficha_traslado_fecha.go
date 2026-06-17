package models

import "time"

// InstructorFichaTrasladoFecha permuta sesiones puntuales entre dos instructores (sin cambiar días recurrentes).
type InstructorFichaTrasladoFecha struct {
	BaseModel
	FichaID             uint      `gorm:"column:ficha_id;not null;index" json:"ficha_id"`
	InstructorOrigenID  uint      `gorm:"column:instructor_origen_id;not null" json:"instructor_origen_id"`
	InstructorDestinoID uint      `gorm:"column:instructor_destino_id;not null" json:"instructor_destino_id"`
	DiaOrigenID         uint      `gorm:"column:dia_origen_id;not null" json:"dia_origen_id"`
	DiaDestinoID        uint      `gorm:"column:dia_destino_id;not null" json:"dia_destino_id"`
	FechaOrigen         time.Time `gorm:"column:fecha_origen;type:date;not null;index" json:"fecha_origen"`
	FechaDestino        time.Time `gorm:"column:fecha_destino;type:date;not null;index" json:"fecha_destino"`
	Motivo              string    `gorm:"column:motivo;size:500" json:"motivo"`
	ActorUserID         uint      `gorm:"column:actor_user_id" json:"actor_user_id"`
}

func (InstructorFichaTrasladoFecha) TableName() string {
	return "instructor_ficha_traslado_fechas"
}
