package dto

// ProgramaFormacionRequest representa la solicitud de creación/actualización de programa de formación
type ProgramaFormacionRequest struct {
	Codigo               string `json:"codigo" binding:"required"`
	Nombre               string `json:"nombre" binding:"required"`
	RedConocimientoID    *uint  `json:"red_conocimiento_id"`
	NivelFormacionID     *uint  `json:"nivel_formacion_id"`
	TipoProgramaID       *uint  `json:"tipo_programa_id"`
	Status               *bool  `json:"status"`
	HorasTotales         *int   `json:"horas_totales"`
	HorasEtapaLectiva    *int   `json:"horas_etapa_lectiva"`
	HorasEtapaProductiva *int   `json:"horas_etapa_productiva"`
}

// ProgramaFormacionResponse representa la respuesta de programa de formación
type ProgramaFormacionResponse struct {
	ID                   uint   `json:"id"`
	Codigo               string `json:"codigo"`
	Nombre               string `json:"nombre"`
	RedConocimientoID    *uint  `json:"red_conocimiento_id"`
	RedConocimientoNombre string `json:"red_conocimiento_nombre,omitempty"`
	NivelFormacionID     *uint  `json:"nivel_formacion_id"`
	TipoProgramaID       *uint  `json:"tipo_programa_id"`
	Status               bool   `json:"status"`
	HorasTotales         *int   `json:"horas_totales"`
	HorasEtapaLectiva    *int   `json:"horas_etapa_lectiva"`
	HorasEtapaProductiva *int   `json:"horas_etapa_productiva"`
	CantidadFichas       int    `json:"cantidad_fichas,omitempty"`
}
