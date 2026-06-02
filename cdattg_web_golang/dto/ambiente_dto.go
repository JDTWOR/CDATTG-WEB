package dto

// AmbienteCreateRequest request para crear un ambiente de formación.
type AmbienteCreateRequest struct {
	Nombre string `json:"nombre" binding:"required"`
	PisoID uint   `json:"piso_id" binding:"required"`
}

// AmbienteUpdateRequest request para actualizar un ambiente.
type AmbienteUpdateRequest struct {
	Nombre string `json:"nombre" binding:"required"`
	PisoID uint   `json:"piso_id" binding:"required"`
	Status *bool  `json:"status"`
}

// AmbienteResponse respuesta básica de ambiente.
type AmbienteResponse struct {
	ID     uint   `json:"id"`
	Nombre string `json:"nombre"`
	PisoID uint   `json:"piso_id"`
	Status bool   `json:"status"`
}

// AmbienteListItem ambiente para listado de infraestructura.
type AmbienteListItem struct {
	ID           uint   `json:"id"`
	Nombre       string `json:"nombre"`
	PisoID       uint   `json:"piso_id"`
	PisoNombre   string `json:"piso_nombre"`
	BloqueNombre string `json:"bloque_nombre"`
	SedeNombre   string `json:"sede_nombre"`
	Status       bool   `json:"status"`
}

