package dto

import "time"

// FichaCaracterizacionRequest representa la solicitud de creación/actualización de ficha
type FichaCaracterizacionRequest struct {
	ProgramaFormacionID  *uint                   `json:"programa_formacion_id"`
	Nombre               string                  `json:"nombre"`
	Ficha                string                  `json:"ficha" binding:"required"`
	TipoFormacion        string                  `json:"tipo_formacion"`
	InstructorID         *uint                   `json:"instructor_id"`
	FechaInicio          *FlexDate               `json:"fecha_inicio"`
	FechaFin             *FlexDate               `json:"fecha_fin"`
	AmbienteID           *uint                   `json:"ambiente_id"`
	ModalidadFormacionID *uint                   `json:"modalidad_formacion_id"`
	SedeID               *uint                   `json:"sede_id"`
	JornadaID            *uint                   `json:"jornada_id"`
	TotalHoras           *int                    `json:"total_horas"`
	Status               *bool                   `json:"status"`
	// StatusManual override manual del estado (true/false fuerza, null = automático por fechas).
	StatusManual         *bool                   `json:"status_manual"`
	DiasFormacionIDs     []uint                  `json:"dias_formacion_ids"`
	DiasFormacion        []FichaDiaFormacionItem `json:"dias_formacion,omitempty"`
	Horarios             []FichaDiaFormacionItem `json:"horarios,omitempty"`
}

// FichaCaracterizacionResponse representa la respuesta de ficha
type FichaCaracterizacionResponse struct {
	ID                       uint                    `json:"id"`
	ProgramaFormacionID      *uint                   `json:"programa_formacion_id"`
	Nombre                   string                  `json:"nombre"`
	ProgramaFormacionNombre  string                  `json:"programa_formacion_nombre"`
	Ficha                    string                  `json:"ficha"`
	TipoFormacion            string                  `json:"tipo_formacion"`
	InstructorID             *uint                   `json:"instructor_id"`
	InstructorNombre         string                  `json:"instructor_nombre"`
	FechaInicio              *time.Time              `json:"fecha_inicio"`
	FechaFin                 *time.Time              `json:"fecha_fin"`
	AmbienteID               *uint                   `json:"ambiente_id"`
	AmbienteNombre           string                  `json:"ambiente_nombre"`
	SedeID                   *uint                   `json:"sede_id"`
	SedeNombre                string                  `json:"sede_nombre"`
	ModalidadFormacionID     *uint                   `json:"modalidad_formacion_id"`
	ModalidadFormacionNombre string                  `json:"modalidad_formacion_nombre"`
	JornadaID                *uint                   `json:"jornada_id"`
	JornadaNombre            string                  `json:"jornada_nombre"`
	TotalHoras               *int                    `json:"total_horas"`
	Status                   bool                    `json:"status"`
	StatusManual             *bool                   `json:"status_manual"`
	DiasFormacionIDs         []uint                  `json:"dias_formacion_ids"`
	DiasFormacionNombres     []string                `json:"dias_formacion_nombres"`
	DiasFormacion            []FichaDiaFormacionItem `json:"dias_formacion,omitempty"`
	Horarios                 []FichaDiaFormacionItem `json:"horarios,omitempty"`
	CantidadAprendices       int                     `json:"cantidad_aprendices"`
}
