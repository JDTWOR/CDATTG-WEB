package dto

import "time"

type EleccionProcesoRequest struct {
	RegionalID             uint       `json:"regional_id" binding:"required"`
	Anio                   int        `json:"anio" binding:"required"`
	NombreCiclo            string     `json:"nombre_ciclo" binding:"required"`
	FechaInscripcionInicio *time.Time `json:"fecha_inscripcion_inicio"`
	FechaInscripcionFin    *time.Time `json:"fecha_inscripcion_fin"`
	FechaVotacionInicio    *time.Time `json:"fecha_votacion_inicio"`
	FechaVotacionFin       *time.Time `json:"fecha_votacion_fin"`
	MinDiasMatricula       *int       `json:"min_dias_matricula"`
}

type EleccionProcesoResponse struct {
	ID                     uint       `json:"id"`
	RegionalID             uint       `json:"regional_id"`
	RegionalNombre         string     `json:"regional_nombre,omitempty"`
	Anio                   int        `json:"anio"`
	NombreCiclo            string     `json:"nombre_ciclo"`
	Estado                 string     `json:"estado"`
	FechaInscripcionInicio *time.Time `json:"fecha_inscripcion_inicio,omitempty"`
	FechaInscripcionFin    *time.Time `json:"fecha_inscripcion_fin,omitempty"`
	FechaVotacionInicio    *time.Time `json:"fecha_votacion_inicio,omitempty"`
	FechaVotacionFin       *time.Time `json:"fecha_votacion_fin,omitempty"`
	MinDiasMatricula       *int       `json:"min_dias_matricula,omitempty"`
	PlanchasConfirmadas    int        `json:"planchas_confirmadas,omitempty"`
	VotosRegistrados       int        `json:"votos_registrados,omitempty"`
	AprendicesElegibles    int        `json:"aprendices_elegibles,omitempty"`
	CreatedAt              time.Time  `json:"created_at"`
}

type EleccionPlanchaRequest struct {
	RolCandidatura      string `json:"rol_candidatura" binding:"required,oneof=titular suplente"`
	CompaneroAprendizID uint   `json:"companero_aprendiz_id" binding:"required"`
}

type EleccionAprendizResumen struct {
	ID       uint   `json:"id"`
	Nombre   string `json:"nombre"`
	Ficha    string `json:"ficha,omitempty"`
	Sede     string `json:"sede,omitempty"`
}

type EleccionPlanchaResponse struct {
	ID                   uint                    `json:"id"`
	ProcesoID            uint                    `json:"proceso_id"`
	Estado               string                  `json:"estado"`
	Titular              EleccionAprendizResumen `json:"titular"`
	Suplente             EleccionAprendizResumen `json:"suplente"`
	TitularConfirmado    bool                    `json:"titular_confirmado"`
	SuplenteConfirmado   bool                    `json:"suplente_confirmado"`
	VotosRecibidos       int                     `json:"votos_recibidos,omitempty"`
	MotivoRechazo        *string                 `json:"motivo_rechazo,omitempty"`
	PendienteMiConfirmacion bool                 `json:"pendiente_mi_confirmacion,omitempty"`
}

type EleccionVotoRequest struct {
	PlanchaID uint `json:"plancha_id" binding:"required"`
}

type EleccionVotoResponse struct {
	ProcesoID   uint      `json:"proceso_id"`
	PlanchaID   uint      `json:"plancha_id"`
	VotanteNombre string  `json:"votante_nombre"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type EleccionResultadoPlanchaConteo struct {
	PlanchaID uint   `json:"plancha_id"`
	Label     string `json:"label"`
	Votos     int    `json:"votos"`
}

type EleccionResultadoResponse struct {
	ProcesoID         uint                             `json:"proceso_id"`
	EstadoProceso     string                           `json:"estado_proceso"`
	PlanchaGanadoraID *uint                            `json:"plancha_ganadora_id,omitempty"`
	VotosTotales      int                              `json:"votos_totales"`
	ParticipacionPct  float64                          `json:"participacion_pct"`
	Empate            bool                             `json:"empate"`
	NotaDesempate     *string                          `json:"nota_desempate,omitempty"`
	Conteo            []EleccionResultadoPlanchaConteo `json:"conteo"`
	Votos             []EleccionVotoAuditoriaItem      `json:"votos,omitempty"`
}

type EleccionVotoAuditoriaItem struct {
	VotanteNombre string    `json:"votante_nombre"`
	VotanteDoc    string    `json:"votante_documento,omitempty"`
	PlanchaID     uint      `json:"plancha_id"`
	PlanchaLabel  string    `json:"plancha_label"`
	VotadoAt      time.Time `json:"votado_at"`
}

type EleccionDesempateRequest struct {
	PlanchaGanadoraID uint   `json:"plancha_ganadora_id" binding:"required"`
	NotaDesempate     string `json:"nota_desempate" binding:"required"`
}

type EleccionRechazarPlanchaRequest struct {
	Motivo string `json:"motivo" binding:"required"`
}

type RepresentanteAprendizResponse struct {
	RegionalID       uint                    `json:"regional_id"`
	RegionalNombre   string                  `json:"regional_nombre,omitempty"`
	ProcesoID        uint                    `json:"proceso_id"`
	NombreCiclo      string                  `json:"nombre_ciclo,omitempty"`
	Anio             int                     `json:"anio,omitempty"`
	Titular          EleccionAprendizResumen `json:"titular"`
	Suplente         EleccionAprendizResumen `json:"suplente"`
	VigenciaDesde    time.Time               `json:"vigencia_desde"`
	VigenciaHasta    *time.Time              `json:"vigencia_hasta,omitempty"`
}

type EleccionMiRegionalResponse struct {
	RegionalID              uint                         `json:"regional_id"`
	RegionalNombre          string                       `json:"regional_nombre,omitempty"`
	Proceso                 *EleccionProcesoResponse     `json:"proceso,omitempty"`
	RepresentantesVigentes  *RepresentanteAprendizResponse `json:"representantes_vigentes,omitempty"`
	MiAprendizID            *uint                        `json:"mi_aprendiz_id,omitempty"`
	PuedeVotar              bool                         `json:"puede_votar"`
	PuedePostular           bool                         `json:"puede_postular"`
	MiVotoPlanchaID         *uint                        `json:"mi_voto_plancha_id,omitempty"`
	YaVoto                  bool                         `json:"ya_voto"`
	EsCandidato             bool                         `json:"es_candidato"`
	PlanchasPendientesConfirmar []EleccionPlanchaResponse `json:"planchas_pendientes_confirmar,omitempty"`
}
