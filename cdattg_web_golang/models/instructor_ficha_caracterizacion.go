package models

import "time"

// InstructorFichaCaracterizacion representa la asignación de un instructor a una ficha (varios instructores por ficha)
type InstructorFichaCaracterizacion struct {
	BaseModel
	InstructorID          uint       `gorm:"column:instructor_id;not null" json:"instructor_id"`
	FichaID               uint       `gorm:"column:ficha_id;not null" json:"ficha_id"`
	CompetenciaID         *uint      `gorm:"column:competencia_id" json:"competencia_id"`
	FechaInicio           *time.Time `gorm:"column:fecha_inicio" json:"fecha_inicio"`
	FechaFin              *time.Time `gorm:"column:fecha_fin" json:"fecha_fin"`
	TotalHorasInstructor  *int       `gorm:"column:total_horas_instructor" json:"total_horas_instructor"`

	// Relaciones
	Instructor  *Instructor          `gorm:"foreignKey:InstructorID" json:"instructor,omitempty"`
	Ficha       *FichaCaracterizacion `gorm:"foreignKey:FichaID" json:"ficha,omitempty"`
	Competencia *Competencia         `gorm:"foreignKey:CompetenciaID" json:"competencia,omitempty"`
}

// TableName especifica el nombre de la tabla
func (InstructorFichaCaracterizacion) TableName() string {
	return "instructor_fichas_caracterizacion"
}
