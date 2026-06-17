package dto

import "time"

type DiaSinFormacionSedeItem struct {
	ID          uint   `json:"id"`
	SedeID      uint   `json:"sede_id"`
	SedeNombre  string `json:"sede_nombre,omitempty"`
	FechaInicio string `json:"fecha_inicio"`
	FechaFin    string `json:"fecha_fin"`
	Motivo      string `json:"motivo"`
	CreatedAt   string `json:"created_at,omitempty"`
}

type DiaSinFormacionSedeCreateRequest struct {
	SedeID      uint   `json:"sede_id" binding:"required"`
	FechaInicio string `json:"fecha_inicio" binding:"required"`
	FechaFin    string `json:"fecha_fin" binding:"required"`
	Motivo      string `json:"motivo" binding:"required"`
}

type DiaSinFormacionSedeUpdateRequest struct {
	FechaInicio string `json:"fecha_inicio" binding:"required"`
	FechaFin    string `json:"fecha_fin" binding:"required"`
	Motivo      string `json:"motivo" binding:"required"`
}

func FormatFechaDTO(t time.Time) string {
	return t.Format(time.DateOnly)
}
