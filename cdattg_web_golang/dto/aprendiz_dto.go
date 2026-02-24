package dto

// AprendizRequest representa la solicitud de creación/actualización de aprendiz (asignar persona a ficha)
type AprendizRequest struct {
	PersonaID             uint  `json:"persona_id" binding:"required"`
	FichaCaracterizacionID uint  `json:"ficha_caracterizacion_id" binding:"required"`
	Estado                *bool `json:"estado"`
}

// AprendizResponse representa la respuesta de aprendiz
type AprendizResponse struct {
	ID                     uint   `json:"id"`
	PersonaID              uint   `json:"persona_id"`
	PersonaNombre          string `json:"persona_nombre"`
	PersonaDocumento       string `json:"persona_documento,omitempty"`
	FichaCaracterizacionID uint   `json:"ficha_caracterizacion_id"`
	FichaNumero            string `json:"ficha_numero,omitempty"`
	ProgramaNombre         string `json:"programa_nombre,omitempty"`
	RegionalNombre         string `json:"regional_nombre,omitempty"`
	Estado                 bool   `json:"estado"`
}

// AsignarAprendicesRequest para POST /fichas/:id/aprendices
type AsignarAprendicesRequest struct {
	Personas []uint `json:"personas" binding:"required,min=1,dive,required"`
}

// DesasignarAprendicesRequest para POST /fichas/:id/aprendices/desasignar
type DesasignarAprendicesRequest struct {
	Personas []uint `json:"personas" binding:"required,min=1,dive,required"`
}
