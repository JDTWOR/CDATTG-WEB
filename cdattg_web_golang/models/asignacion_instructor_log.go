package models

import "time"

// AsignacionInstructorLog representa el log de cambios en asignaciones
type AsignacionInstructorLog struct {
	BaseModel
	AsignacionID uint      `gorm:"column:asignacion_id;not null" json:"asignacion_id"`
	Accion       string    `gorm:"size:50;not null" json:"accion"` // CREAR, ACTUALIZAR, ELIMINAR
	Detalles     string    `gorm:"type:text" json:"detalles"`
	FechaAccion  time.Time `gorm:"column:fecha_accion;not null" json:"fecha_accion"`
	
	// Relaciones
	Asignacion *AsignacionInstructor `gorm:"foreignKey:AsignacionID" json:"asignacion,omitempty"`
}

// TableName especifica el nombre de la tabla
func (AsignacionInstructorLog) TableName() string {
	return "asignacion_instructor_logs"
}
