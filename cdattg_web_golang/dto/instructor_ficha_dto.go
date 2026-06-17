package dto

import "time"

// InstructorFichaItem un instructor en la asignación a ficha
type InstructorFichaItem struct {
	InstructorID         uint     `json:"instructor_id" binding:"required"`
	CompetenciaID        *uint    `json:"competencia_id"`
	FechaInicio          FlexDate `json:"fecha_inicio" binding:"required"`
	FechaFin             FlexDate `json:"fecha_fin" binding:"required"`
	TotalHorasInstructor *int     `json:"total_horas_instructor"`
	DiasFormacionIDs     []uint   `json:"dias_formacion_ids"`
}

// AsignarInstructoresRequest para POST /fichas/:id/instructores
type AsignarInstructoresRequest struct {
	InstructorLiderID uint                 `json:"instructor_lider_id" binding:"required"`
	Instructores         []InstructorFichaItem `json:"instructores" binding:"required,min=1,dive"`
}

// TrasladoParFecha intercambia una sesión puntual (fecha calendario concreta).
type TrasladoParFecha struct {
	FechaOrigen  string `json:"fecha_origen" binding:"required"`
	FechaDestino string `json:"fecha_destino" binding:"required"`
}

// TrasladarDiaRequest representa una permuta de día de formación entre dos instructores.
type TrasladarDiaRequest struct {
	Modo                string             `json:"modo" binding:"required,oneof=permanente fechas"`
	InstructorOrigenID  uint               `json:"instructor_origen_id" binding:"required"`
	DiaOrigenID         uint               `json:"dia_origen_id" binding:"required"`
	InstructorDestinoID uint               `json:"instructor_destino_id" binding:"required"`
	DiaDestinoID        uint               `json:"dia_destino_id" binding:"required"`
	Motivo              string             `json:"motivo" binding:"required,max=500"`
	ParesFechas         []TrasladoParFecha `json:"pares_fechas"`
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
	DiasFormacionIDs      []uint     `json:"dias_formacion_ids"`
	DiasFormacionNombres  []string   `json:"dias_formacion_nombres"`
}
