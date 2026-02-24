package models

import (
	"time"
)

// FichaCaracterizacion representa una ficha de caracterización
type FichaCaracterizacion struct {
	UserAuditModel
	ProgramaFormacionID uint       `gorm:"column:programa_formacion_id;not null" json:"programa_formacion_id"`
	Ficha               string     `gorm:"size:50;not null" json:"ficha"`
	InstructorID        *uint      `gorm:"column:instructor_id" json:"instructor_id"`
	FechaInicio         *time.Time `gorm:"column:fecha_inicio" json:"fecha_inicio"`
	FechaFin            *time.Time `gorm:"column:fecha_fin" json:"fecha_fin"`
	AmbienteID          *uint      `gorm:"column:ambiente_id" json:"ambiente_id"`
	ModalidadFormacionID *uint     `gorm:"column:modalidad_formacion_id" json:"modalidad_formacion_id"`
	SedeID              *uint      `gorm:"column:sede_id" json:"sede_id"`
	JornadaID           *uint      `gorm:"column:jornada_id" json:"jornada_id"`
	TotalHoras          *int       `gorm:"column:total_horas" json:"total_horas"`
	Status              bool       `gorm:"default:true" json:"status"`
	
	// Relaciones
	ProgramaFormacion   *ProgramaFormacion   `gorm:"foreignKey:ProgramaFormacionID" json:"programa_formacion,omitempty"`
	Instructor          *Instructor          `gorm:"foreignKey:InstructorID" json:"instructor,omitempty"`
	Ambiente            *Ambiente            `gorm:"foreignKey:AmbienteID" json:"ambiente,omitempty"`
	ModalidadFormacion  *ModalidadFormacion  `gorm:"foreignKey:ModalidadFormacionID" json:"modalidad_formacion,omitempty"`
	Sede                *Sede                `gorm:"foreignKey:SedeID" json:"sede,omitempty"`
	Jornada             *Jornada             `gorm:"foreignKey:JornadaID" json:"jornada,omitempty"`
	FichaDiasFormacion  []FichaDiasFormacion `gorm:"foreignKey:FichaID" json:"ficha_dias_formacion,omitempty"`
	Aprendices         []Aprendiz                   `gorm:"foreignKey:FichaCaracterizacionID" json:"aprendices,omitempty"`
	InstructorFichas   []InstructorFichaCaracterizacion `gorm:"foreignKey:FichaID" json:"instructor_fichas,omitempty"`
}

// TableName especifica el nombre de la tabla
func (FichaCaracterizacion) TableName() string {
	return "fichas_caracterizacion"
}
