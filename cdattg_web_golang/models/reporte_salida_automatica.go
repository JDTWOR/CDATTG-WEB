package models

import "time"

// ReporteSalidaAutomatica representa reportes de salida automática
type ReporteSalidaAutomatica struct {
	BaseModel
	PersonaID      uint      `gorm:"column:persona_id;not null" json:"persona_id"`
	SedeID         uint      `gorm:"column:sede_id;not null" json:"sede_id"`
	FechaReporte   time.Time `gorm:"column:fecha_reporte;not null" json:"fecha_reporte"`
	HoraSalida     time.Time `gorm:"column:hora_salida;not null" json:"hora_salida"`
	Motivo          string    `gorm:"size:255" json:"motivo"`
	Observaciones   string    `gorm:"type:text" json:"observaciones"`
	
	// Relaciones
	Persona *Persona `gorm:"foreignKey:PersonaID" json:"persona,omitempty"`
	Sede    *Sede    `gorm:"foreignKey:SedeID" json:"sede,omitempty"`
}

// TableName especifica el nombre de la tabla
func (ReporteSalidaAutomatica) TableName() string {
	return "reporte_salida_automatica"
}
