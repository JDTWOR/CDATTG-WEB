package dto

import "time"

// InstructorFichaItem un instructor en la asignación a ficha
type InstructorFichaItem struct {
	InstructorID          uint      `json:"instructor_id" binding:"required"`
	CompetenciaID         *uint     `json:"competencia_id"`
	FechaInicio           FlexDate  `json:"fecha_inicio" binding:"required"`
	FechaFin              FlexDate  `json:"fecha_fin" binding:"required"`
	TotalHorasInstructor  *int      `json:"total_horas_instructor"`
}

// AsignarInstructoresRequest para POST /fichas/:id/instructores
type AsignarInstructoresRequest struct {
	InstructorPrincipalID uint                 `json:"instructor_principal_id" binding:"required"`
	Instructores         []InstructorFichaItem `json:"instructores" binding:"required,min=1,dive"`
}

// InstructorFichaResponse respuesta de una asignación instructor-ficha
type InstructorFichaResponse struct {
	ID                    uint       `json:"id"`
	InstructorID          uint       `json:"instructor_id"`
	InstructorNombre      string     `json:"instructor_nombre"`
	FichaID               uint       `json:"ficha_id"`
	CompetenciaID         *uint      `json:"competencia_id"`
	CompetenciaNombre     string     `json:"competencia_nombre,omitempty"`
	FechaInicio           *time.Time `json:"fecha_inicio"`
	FechaFin              *time.Time `json:"fecha_fin"`
	TotalHorasInstructor  *int       `json:"total_horas_instructor"`
}
