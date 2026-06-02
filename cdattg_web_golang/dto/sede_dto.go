package dto

// SedeCreateRequest request para crear una sede (infraestructura).
type SedeCreateRequest struct {
	Nombre     string `json:"nombre" binding:"required"`
	Direccion  string `json:"direccion"`
	RegionalID uint   `json:"regional_id" binding:"required"`
}

// SedeUpdateRequest request para actualizar una sede (infraestructura).
type SedeUpdateRequest struct {
	Nombre     string `json:"nombre" binding:"required"`
	Direccion  string `json:"direccion"`
	RegionalID uint   `json:"regional_id" binding:"required"`
	Status     *bool  `json:"status"`
}

// SedeResponse respuesta básica de sede.
type SedeResponse struct {
	ID         uint   `json:"id"`
	Nombre     string `json:"nombre"`
	Direccion  string `json:"direccion"`
	RegionalID uint   `json:"regional_id"`
	Status     bool   `json:"status"`
}

// SedeListItem sede para listado de infraestructura.
type SedeListItem struct {
	ID             uint   `json:"id"`
	Nombre         string `json:"nombre"`
	Direccion      string `json:"direccion"`
	RegionalID     uint   `json:"regional_id"`
	RegionalNombre string `json:"regional_nombre"`
	Status         bool   `json:"status"`
}

