package models

import "time"

// AsignacionInstructor representa una asignación de instructor a una ficha
type AsignacionInstructor struct {
	BaseModel
	InstructorID uint       `gorm:"column:instructor_id;not null" json:"instructor_id"`
	FichaID      uint       `gorm:"column:ficha_id;not null" json:"ficha_id"`
	FechaInicio  *time.Time `gorm:"column:fecha_inicio" json:"fecha_inicio"`
	FechaFin     *time.Time `gorm:"column:fecha_fin" json:"fecha_fin"`
	TotalHoras   *int       `gorm:"column:total_horas" json:"total_horas"`
	Status       bool       `gorm:"default:true" json:"status"`
	
	// Relaciones
	Instructor *Instructor        `gorm:"foreignKey:InstructorID" json:"instructor,omitempty"`
	Ficha      *FichaCaracterizacion `gorm:"foreignKey:FichaID" json:"ficha,omitempty"`
	ResultadosAprendizaje []ResultadosAprendizaje `gorm:"many2many:asignacion_instructor_resultado;foreignKey:ID;joinForeignKey:asignacion_id;References:ID;joinReferences:resultado_aprendizaje_id" json:"resultados_aprendizaje,omitempty"`
	Logs []AsignacionInstructorLog `gorm:"foreignKey:AsignacionID" json:"logs,omitempty"`
}

// TableName especifica el nombre de la tabla
func (AsignacionInstructor) TableName() string {
	return "asignaciones_instructor"
}
