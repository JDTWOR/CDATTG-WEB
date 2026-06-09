package dto

// JornadaBloqueItem bloque horario de una plantilla de jornada.
type JornadaBloqueItem struct {
	ID             uint   `json:"id,omitempty"`
	DiaFormacionID uint   `json:"dia_formacion_id"`
	DiaNombre      string `json:"dia_nombre,omitempty"`
	HoraInicio     string `json:"hora_inicio"`
	HoraFin        string `json:"hora_fin"`
	Orden          int    `json:"orden"`
}

// JornadaAdminItem jornada con bloques para administración y catálogo enriquecido.
type JornadaAdminItem struct {
	ID                  uint                `json:"id"`
	Nombre              string              `json:"nombre"`
	MinutosExtensionFin int                 `json:"minutos_extension_fin"`
	Bloques             []JornadaBloqueItem `json:"bloques"`
}

// JornadaCreateRequest crear plantilla de jornada.
type JornadaCreateRequest struct {
	Nombre              string              `json:"nombre" binding:"required"`
	MinutosExtensionFin *int                `json:"minutos_extension_fin"`
	Bloques             []JornadaBloqueItem `json:"bloques" binding:"required,min=1"`
}

// JornadaUpdateRequest actualizar plantilla de jornada.
type JornadaUpdateRequest struct {
	Nombre              string              `json:"nombre" binding:"required"`
	MinutosExtensionFin *int                `json:"minutos_extension_fin"`
	Bloques             []JornadaBloqueItem `json:"bloques" binding:"required,min=1"`
	PropagarFichas      *bool               `json:"propagar_fichas"`
}

// JornadaPropagateResult resumen de propagación a fichas.
type JornadaPropagateResult struct {
	Actualizadas int                        `json:"actualizadas"`
	Omitidas     int                        `json:"omitidas"`
	Detalles     []JornadaPropagateDetalle  `json:"detalles,omitempty"`
}

// JornadaPropagateDetalle ficha omitida con motivo.
type JornadaPropagateDetalle struct {
	FichaID uint   `json:"ficha_id"`
	Ficha   string `json:"ficha,omitempty"`
	Motivo  string `json:"motivo"`
}

// JornadaUpdateResponse respuesta al actualizar con propagación opcional.
type JornadaUpdateResponse struct {
	JornadaAdminItem
	Propagacion *JornadaPropagateResult `json:"propagacion,omitempty"`
}
