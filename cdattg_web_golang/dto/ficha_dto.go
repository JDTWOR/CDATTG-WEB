package dto

import "time"

// FichaCaracterizacionRequest representa la solicitud de creación/actualización de ficha
type FichaCaracterizacionRequest struct {
	ProgramaFormacionID  uint       `json:"programa_formacion_id" binding:"required"`
	Ficha                string     `json:"ficha" binding:"required"`
	InstructorID         *uint      `json:"instructor_id"`
	FechaInicio          *FlexDate  `json:"fecha_inicio"`
	FechaFin             *FlexDate  `json:"fecha_fin"`
	AmbienteID           *uint      `json:"ambiente_id"`
	ModalidadFormacionID *uint      `json:"modalidad_formacion_id"`
	SedeID               *uint      `json:"sede_id"`
	JornadaID            *uint      `json:"jornada_id"`
	TotalHoras           *int       `json:"total_horas"`
	Status               *bool      `json:"status"`
	DiasFormacionIDs     []uint     `json:"dias_formacion_ids"`
}

// FichaCaracterizacionResponse representa la respuesta de ficha
type FichaCaracterizacionResponse struct {
	ID                    uint       `json:"id"`
	ProgramaFormacionID   uint       `json:"programa_formacion_id"`
	ProgramaFormacionNombre string  `json:"programa_formacion_nombre"`
	Ficha                 string     `json:"ficha"`
	InstructorID          *uint      `json:"instructor_id"`
	InstructorNombre      string     `json:"instructor_nombre"`
	FechaInicio           *time.Time `json:"fecha_inicio"`
	FechaFin              *time.Time `json:"fecha_fin"`
	AmbienteID            *uint      `json:"ambiente_id"`
	AmbienteNombre        string     `json:"ambiente_nombre"`
	SedeID                *uint      `json:"sede_id"`
	SedeNombre            string     `json:"sede_nombre"`
	ModalidadFormacionID  *uint      `json:"modalidad_formacion_id"`
	ModalidadFormacionNombre string  `json:"modalidad_formacion_nombre"`
	JornadaID             *uint      `json:"jornada_id"`
	JornadaNombre         string     `json:"jornada_nombre"`
	TotalHoras            *int       `json:"total_horas"`
	Status                bool       `json:"status"`
	DiasFormacionIDs      []uint     `json:"dias_formacion_ids"`
	CantidadAprendices    int        `json:"cantidad_aprendices"`
}
