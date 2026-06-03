package dto

// InstructorAgendaEvent evento expandido en el calendario semanal.
type InstructorAgendaEvent struct {
	Fecha              string `json:"fecha"` // YYYY-MM-DD
	DiaFormacionID     uint   `json:"dia_formacion_id"`
	DiaNombre          string `json:"dia_nombre,omitempty"`
	HoraInicio         string `json:"hora_inicio"`
	HoraFin            string `json:"hora_fin"`
	FichaID            uint   `json:"ficha_id"`
	FichaNumero        string `json:"ficha_numero"`
	ProgramaNombre     string `json:"programa_nombre,omitempty"`
	SedeNombre         string `json:"sede_nombre,omitempty"`
	AmbienteNombre     string `json:"ambiente_nombre,omitempty"`
	InstructorID       uint   `json:"instructor_id,omitempty"`
	InstructorNombre   string `json:"instructor_nombre,omitempty"`
	InstructorDocumento string `json:"instructor_documento,omitempty"`
}

// InstructorAgendaResponse respuesta de endpoints de agenda.
type InstructorAgendaResponse struct {
	Desde  string                  `json:"desde"`
	Hasta  string                  `json:"hasta"`
	Eventos []InstructorAgendaEvent `json:"eventos"`
}
