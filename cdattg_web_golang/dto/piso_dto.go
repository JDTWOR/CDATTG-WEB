package dto

// PisoCreateRequest request para crear un piso en un bloque.
type PisoCreateRequest struct {
	Nombre   string `json:"nombre" binding:"required"`
	BloqueID uint   `json:"bloque_id" binding:"required"`
}

// PisoResponse respuesta básica de piso.
type PisoResponse struct {
	ID       uint   `json:"id"`
	Nombre   string `json:"nombre"`
	BloqueID uint   `json:"bloque_id"`
}

