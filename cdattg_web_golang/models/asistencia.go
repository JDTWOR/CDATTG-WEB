package models

import (
	"time"
)

// Asistencia representa una sesión de asistencia
type Asistencia struct {
	UserAuditModel
	EvidenciaID      *uint      `gorm:"column:evidencia_id" json:"evidencia_id"`
	InstructorFichaID uint      `gorm:"column:instructor_ficha_id;not null" json:"instructor_ficha_id"`
	Fecha            time.Time  `gorm:"not null" json:"fecha"`
	HoraInicio       *time.Time `gorm:"column:hora_inicio" json:"hora_inicio"`
	HoraFin          *time.Time `gorm:"column:hora_fin" json:"hora_fin"`
	IsFinished       bool       `gorm:"column:is_finished;default:false" json:"is_finished"`
	Observaciones    string     `gorm:"type:text" json:"observaciones"`
	
	// Relaciones
	Evidencia            *Evidencia                   `gorm:"foreignKey:EvidenciaID" json:"evidencia,omitempty"`
	InstructorFicha      *InstructorFichaCaracterizacion `gorm:"foreignKey:InstructorFichaID" json:"instructor_ficha,omitempty"`
	AsistenciaAprendices []AsistenciaAprendiz         `gorm:"foreignKey:AsistenciaID" json:"asistencia_aprendices,omitempty"`
}

// TableName especifica el nombre de la tabla
func (Asistencia) TableName() string {
	return "asistencias"
}
