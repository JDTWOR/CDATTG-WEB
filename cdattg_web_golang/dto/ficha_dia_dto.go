package dto

// FichaDiaFormacionItem detalle de un bloque horario de formación de la ficha.
type FichaDiaFormacionItem struct {
	DiaFormacionID uint   `json:"dia_formacion_id"`
	DiaNombre      string `json:"dia_nombre,omitempty"`
	HoraInicio     string `json:"hora_inicio"`
	HoraFin        string `json:"hora_fin"`
	Orden          int    `json:"orden,omitempty"`
	JornadaID      *uint  `json:"jornada_id,omitempty"`
	JornadaNombre  string `json:"jornada_nombre,omitempty"`
}
