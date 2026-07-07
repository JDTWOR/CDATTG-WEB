package dto

// AsistenciaAnalisisResponse panel analítico de asistencia (bloques A, B y C).
type AsistenciaAnalisisResponse struct {
	FechaDesde string                    `json:"fecha_desde"`
	FechaHasta string                    `json:"fecha_hasta"`
	HoraToma   AnalisisHoraTomaSection   `json:"hora_toma"`
	Cumplimiento AnalisisCumplimientoSection `json:"cumplimiento"`
	DiaSemana  AnalisisDiaSemanaSection  `json:"dia_semana"`
}

// AnalisisHoraTomaSection bloque A: hora promedio en que el instructor toma asistencia (primer registro por sesión).
type AnalisisHoraTomaSection struct {
	PromedioHora       string                     `json:"promedio_hora"`
	PromedioMinutosDia int                        `json:"promedio_minutos_dia"`
	TotalSesiones      int                        `json:"total_sesiones"`
	DetallePorFicha    []AnalisisHoraTomaPorFicha `json:"detalle_por_ficha"`
}

type AnalisisHoraTomaPorFicha struct {
	FichaID       uint   `json:"ficha_id"`
	FichaNumero   string `json:"ficha_numero"`
	JornadaNombre string `json:"jornada_nombre"`
	PromedioHora  string `json:"promedio_hora"`
	TotalSesiones int    `json:"total_sesiones"`
}

// AnalisisCumplimientoSection bloque B: % días con sesión vs días programados por ficha.
type AnalisisCumplimientoSection struct {
	Items []AnalisisCumplimientoFicha `json:"items"`
}

type AnalisisCumplimientoFicha struct {
	FichaID          uint    `json:"ficha_id"`
	FichaNumero      string  `json:"ficha_numero"`
	ProgramaNombre   string  `json:"programa_nombre"`
	JornadaNombre    string  `json:"jornada_nombre"`
	SedeNombre       string  `json:"sede_nombre"`
	DiasProgramados  int     `json:"dias_programados"`
	DiasConSesion    int     `json:"dias_con_sesion"`
	PctCumplimiento  float64 `json:"pct_cumplimiento"`
}

// AnalisisDiaSemanaSection bloque C: asistencia por día de semana (solo aprendices en formación activa).
type AnalisisDiaSemanaSection struct {
	PorDiaJornada   []AnalisisDiaSemanaJornada `json:"por_dia_jornada"`
	DiasMasAsistencia []AnalisisDiaRanking    `json:"dias_mas_asistencia"`
}

type AnalisisDiaSemanaJornada struct {
	DiaSemanaID   int     `json:"dia_semana_id"`
	DiaSemana     string  `json:"dia_semana"`
	JornadaNombre string  `json:"jornada_nombre"`
	Esperados     int     `json:"esperados"`
	Vinieron      int     `json:"vinieron"`
	Pct           float64 `json:"pct"`
}

type AnalisisDiaRanking struct {
	DiaSemanaID int    `json:"dia_semana_id"`
	DiaSemana   string `json:"dia_semana"`
	Vinieron    int    `json:"vinieron"`
	Pct         float64 `json:"pct"`
}
