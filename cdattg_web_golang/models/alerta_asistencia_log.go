package models

import "time"

// AlertaAsistenciaLog registra que ya se envió la alerta por correo para una ficha en una fecha.
// Evita enviar el mismo aviso varias veces en la misma jornada.
type AlertaAsistenciaLog struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	FichaID   uint      `gorm:"column:ficha_id;not null;uniqueIndex:idx_alerta_ficha_fecha" json:"ficha_id"`
	Fecha     time.Time `gorm:"column:fecha;type:date;not null;uniqueIndex:idx_alerta_ficha_fecha" json:"fecha"`
	CreatedAt time.Time `gorm:"column:created_at" json:"created_at"`

	Ficha *FichaCaracterizacion `gorm:"foreignKey:FichaID" json:"ficha,omitempty"`
}

// TableName especifica el nombre de la tabla
func (AlertaAsistenciaLog) TableName() string {
	return "alertas_asistencia_log"
}
