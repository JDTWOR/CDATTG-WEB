package dto

// DashboardResumenResponse agregación institucional para el panel KPI de asistencia.
type DashboardResumenResponse struct {
	Fecha         string                    `json:"fecha"`
	Institucion   DashboardInstitucionStats `json:"institucion"`
	AsistenciaHoy DashboardAsistenciaHoy    `json:"asistencia_hoy"`
	PorSede       []DashboardSedeStats      `json:"por_sede"`
	PorJornada    []DashboardJornadaStats   `json:"por_jornada"`
	PorRegional   []DashboardRegionalStats  `json:"por_regional"`
	FichasSinSesion []AsistenciaDashboardFichaSinSesion `json:"fichas_sin_sesion"`
	Riesgo        DashboardRiesgoStats      `json:"riesgo"`
	Alcance       DashboardAlcance          `json:"alcance"`
	JornadasActivas    []string `json:"jornadas_activas"`
	JornadasDisponibles []string `json:"jornadas_disponibles"`
	PorFicha            []AsistenciaDashboardPorFicha `json:"por_ficha"`
	UltimosDiasFormacion []DashboardDiaFormacionStats `json:"ultimos_dias_formacion"`
}

// DashboardDiaFormacionStats asistencia agregada en un día con formación programada.
type DashboardDiaFormacionStats struct {
	Fecha     string  `json:"fecha"`
	Etiqueta  string  `json:"etiqueta"`
	Esperados int     `json:"esperados"`
	Vinieron  int     `json:"vinieron"`
	Pct       float64 `json:"pct"`
}

type DashboardInstitucionStats struct {
	TotalRegionales   int `json:"total_regionales"`
	TotalSedes        int `json:"total_sedes"`
	TotalFichasActivas int `json:"total_fichas_activas"`
	TotalInstructores int `json:"total_instructores"`
	TotalAprendices   int `json:"total_aprendices"`
}

type DashboardAsistenciaHoy struct {
	EnFormacionAhora      int     `json:"en_formacion_ahora"`
	Esperados             int     `json:"esperados"`
	PendientesRevision    int     `json:"pendientes_revision"`
	FichasConSesion       int     `json:"fichas_con_sesion"`
	FichasSinSesion       int     `json:"fichas_sin_sesion"`
	PctCobertura          float64 `json:"pct_cobertura"`
	TotalFichasRegistradas int    `json:"total_fichas_registradas"`
}

type DashboardSedeStats struct {
	Nombre         string  `json:"nombre"`
	RegionalNombre string  `json:"regional_nombre"`
	Vinieron       int     `json:"vinieron"`
	Total          int     `json:"total"`
	Pct            float64 `json:"pct"`
}

type DashboardJornadaStats struct {
	Nombre   string  `json:"nombre"`
	Vinieron int     `json:"vinieron"`
	Total    int     `json:"total"`
	Pct      float64 `json:"pct"`
}

type DashboardRegionalStats struct {
	Nombre           string `json:"nombre"`
	Vinieron         int    `json:"vinieron"`
	Total            int    `json:"total"`
	FichasSinSesion  int    `json:"fichas_sin_sesion"`
}

type DashboardRiesgoStats struct {
	CasosBienestar       int `json:"casos_bienestar"`
	PendientesRevision   int `json:"pendientes_revision"`
}

type DashboardAlcance struct {
	Restricted      bool     `json:"restricted"`
	Empty           bool     `json:"empty"`
	RegionalIDs     []uint   `json:"regional_ids"`
	RegionalNombres []string `json:"regional_nombres"`
}
