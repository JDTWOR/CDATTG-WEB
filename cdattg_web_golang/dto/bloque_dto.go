package dto

// BloqueCreateRequest request para crear un bloque en una sede.
type BloqueCreateRequest struct {
	Nombre string `json:"nombre" binding:"required"`
	SedeID uint   `json:"sede_id" binding:"required"`
}

// BloqueResponse respuesta básica de bloque.
type BloqueResponse struct {
	ID     uint   `json:"id"`
	Nombre string `json:"nombre"`
	SedeID uint   `json:"sede_id"`
}

