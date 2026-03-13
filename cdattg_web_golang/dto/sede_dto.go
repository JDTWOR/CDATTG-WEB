package dto

// SedeCreateRequest request para crear una sede (infraestructura).
type SedeCreateRequest struct {
	Nombre     string `json:"nombre" binding:"required"`
	Direccion  string `json:"direccion"`
	RegionalID uint   `json:"regional_id" binding:"required"`
}

// SedeResponse respuesta básica de sede.
type SedeResponse struct {
	ID         uint   `json:"id"`
	Nombre     string `json:"nombre"`
	Direccion  string `json:"direccion"`
	RegionalID uint   `json:"regional_id"`
	Status     bool   `json:"status"`
}

