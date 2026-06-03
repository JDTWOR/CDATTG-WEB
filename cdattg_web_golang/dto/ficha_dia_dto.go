package dto

// FichaDiaFormacionItem detalle de un día de formación de la ficha con horario.
type FichaDiaFormacionItem struct {
	DiaFormacionID uint   `json:"dia_formacion_id"`
	DiaNombre      string `json:"dia_nombre,omitempty"`
	HoraInicio     string `json:"hora_inicio"`
	HoraFin        string `json:"hora_fin"`
}
