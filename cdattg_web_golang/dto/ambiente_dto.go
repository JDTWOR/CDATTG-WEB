package dto

// AmbienteCreateRequest request para crear un ambiente de formación.
type AmbienteCreateRequest struct {
	Nombre string `json:"nombre" binding:"required"`
	PisoID uint   `json:"piso_id" binding:"required"`
}

// AmbienteResponse respuesta básica de ambiente.
type AmbienteResponse struct {
	ID     uint   `json:"id"`
	Nombre string `json:"nombre"`
	PisoID uint   `json:"piso_id"`
	Status bool   `json:"status"`
}

