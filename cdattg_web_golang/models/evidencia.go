package models

import (
	"time"
)

// Evidencia representa una evidencia de formación
type Evidencia struct {
	UserAuditModel
	Codigo         string     `gorm:"size:50" json:"codigo"`
	Nombre         string     `gorm:"size:255;not null" json:"nombre"`
	IdEstado       *uint      `gorm:"column:id_estado" json:"id_estado"`
	FechaEvidencia *time.Time `gorm:"column:fecha_evidencia" json:"fecha_evidencia"`
	
	// Relaciones
	Asistencias []Asistencia `gorm:"foreignKey:EvidenciaID" json:"asistencias,omitempty"`
}

// TableName especifica el nombre de la tabla
func (Evidencia) TableName() string {
	return "evidencias"
}
