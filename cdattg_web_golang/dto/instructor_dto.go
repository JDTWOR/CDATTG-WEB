package dto

// InstructorItem respuesta de instructor para listados.
// Documento y nombre se obtienen de Persona (instructor solo tiene persona_id).
type InstructorItem struct {
	ID              uint   `json:"id"`
	Nombre          string `json:"nombre"`
	NumeroDocumento string `json:"numero_documento"`
	RegionalID      *uint  `json:"regional_id,omitempty"`
	RegionalNombre  string `json:"regional_nombre"`
	Estado          bool   `json:"estado"`
}

// CreateInstructorRequest crea un instructor a partir de una persona
type CreateInstructorRequest struct {
	PersonaID  uint  `json:"persona_id" binding:"required"`
	RegionalID *uint `json:"regional_id"`
}

// UpdateInstructorRequest actualiza regional y estado del instructor
type UpdateInstructorRequest struct {
	RegionalID *uint `json:"regional_id"`
	Estado     *bool `json:"estado"`
}
