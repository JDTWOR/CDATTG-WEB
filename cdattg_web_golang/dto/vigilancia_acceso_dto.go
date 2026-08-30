package dto

// AccesoLookupRequest busca persona por documento en portería.
type AccesoLookupRequest struct {
	NumeroDocumento string `json:"numero_documento" binding:"required"`
	SedeID          *uint  `json:"sede_id"`
	Metodo          string `json:"metodo"` // LASER | CAMARA | MANUAL (informativo)
	// Modo fuerza la acción: ENTRADA | SALIDA. Si vacío, se sugiere según visita abierta.
	Modo string `json:"modo"`
}

// AccesoIngresoRequest confirma ingreso al centro.
// TipoPersona es opcional: el backend lo infiere (aprendiz / instructor / visitante).
type AccesoIngresoRequest struct {
	NumeroDocumento string `json:"numero_documento" binding:"required"`
	TipoPersona     string `json:"tipo_persona"`
	MetodoRegistro  string `json:"metodo_registro" binding:"required"`
	SedeID          *uint  `json:"sede_id"`
	Observaciones   string `json:"observaciones"`
}

// AccesoSalidaRequest confirma salida del centro.
type AccesoSalidaRequest struct {
	NumeroDocumento   string `json:"numero_documento" binding:"required"`
	MotivoSalida      string `json:"motivo_salida" binding:"required"`
	ObservacionSalida string `json:"observacion_salida"`
	MetodoRegistro    string `json:"metodo_registro" binding:"required"`
	SedeID            *uint  `json:"sede_id"`
	// PermitirSinIngreso: registra salida irregular cuando no hay visita abierta.
	PermitirSinIngreso bool   `json:"permitir_sin_ingreso"`
	TipoPersona        string `json:"tipo_persona"` // requerido si permitir_sin_ingreso
}

// AccesoPersonaFicha datos visibles para el vigilante.
type AccesoPersonaFicha struct {
	PersonaID       uint     `json:"persona_id"`
	NumeroDocumento string   `json:"numero_documento"`
	TipoDocumentoID *uint    `json:"tipo_documento_id,omitempty"`
	PrimerNombre    string   `json:"primer_nombre"`
	SegundoNombre   string   `json:"segundo_nombre"`
	PrimerApellido  string   `json:"primer_apellido"`
	SegundoApellido string   `json:"segundo_apellido"`
	NombreCompleto  string   `json:"nombre_completo"`
	Email           string   `json:"email"`
	Celular         string   `json:"celular"`
	Telefono        string   `json:"telefono"`
	EsNueva         bool     `json:"es_nueva"`
	PerfilCompleto  bool     `json:"perfil_completo"`
	TipoSugerido    string   `json:"tipo_sugerido"` // tipo principal para registrar ingreso
	Tipos           []string `json:"tipos"`         // todos los roles detectados (aprendiz, instructor, …)
	TieneFoto       bool     `json:"tiene_foto"`
	FotoDesdeCarnet bool     `json:"foto_desde_carnet"`
}

// AccesoFichaResumen ficha de caracterización activa ligada a la persona (solo si status=true).
type AccesoFichaResumen struct {
	ID                 uint   `json:"id"`
	Numero             string `json:"numero"`
	ProgramaNombre     string `json:"programa_nombre"`
	TipoFormacion      string `json:"tipo_formacion"`
	TipoFormacionLabel string `json:"tipo_formacion_label"`
	JornadaNombre      string `json:"jornada_nombre"`
	SedeNombre         string `json:"sede_nombre"`
	Activa             bool   `json:"activa"`
}

// AccesoVisitaAbierta resumen de la visita abierta actual.
type AccesoVisitaAbierta struct {
	ID               uint   `json:"id"`
	TipoPersona      string `json:"tipo_persona"`
	TimestampEntrada string `json:"timestamp_entrada"`
	MetodoRegistro   string `json:"metodo_registro"`
}

// AccesoLookupResponse resultado del lookup de portería.
type AccesoLookupResponse struct {
	Persona                 AccesoPersonaFicha   `json:"persona"`
	Dentro                  bool                 `json:"dentro"`
	AccionSugerida          string               `json:"accion_sugerida"` // INGRESO | SALIDA
	VisitaAbierta           *AccesoVisitaAbierta  `json:"visita_abierta,omitempty"`
	Ficha                   *AccesoFichaResumen   `json:"ficha,omitempty"`  // primera ficha (compat)
	Fichas                  []AccesoFichaResumen  `json:"fichas,omitempty"` // todas las fichas activas vinculadas
	SedeID                  uint                  `json:"sede_id"`
	TiposPersona            []string              `json:"tipos_persona"`
	MotivosSalida           []string              `json:"motivos_salida"`
	PuedeConfirmar          bool                  `json:"puede_confirmar"`
	Alerta                  string                `json:"alerta,omitempty"`
	PermiteSalidaSinIngreso bool                  `json:"permite_salida_sin_ingreso"`
}

// AccesoRegistroResponse respuesta tras confirmar ingreso/salida.
type AccesoRegistroResponse struct {
	Persona          AccesoPersonaFicha   `json:"persona"`
	Accion           string               `json:"accion"` // INGRESO | SALIDA
	VisitaID         uint                 `json:"visita_id"`
	Dentro           bool                 `json:"dentro"`
	Mensaje          string               `json:"mensaje"`
	VisitaAbierta    *AccesoVisitaAbierta `json:"visita_abierta,omitempty"`
	Ficha            *AccesoFichaResumen  `json:"ficha,omitempty"`
	Fichas           []AccesoFichaResumen `json:"fichas,omitempty"`
	SedeID           uint                 `json:"sede_id"`
	SalidaSinIngreso bool                 `json:"salida_sin_ingreso,omitempty"`
}

// AccesoDentroItem persona actualmente dentro del centro.
type AccesoDentroItem struct {
	VisitaID         uint               `json:"visita_id"`
	Persona          AccesoPersonaFicha `json:"persona"`
	TipoPersona      string             `json:"tipo_persona"`
	TimestampEntrada string             `json:"timestamp_entrada"`
	MetodoRegistro   string             `json:"metodo_registro"`
}

// AccesoHistorialFiltros query de historial / estadísticas.
type AccesoHistorialFiltros struct {
	RegionalID       *uint
	SedeID           *uint
	FechaDesde       string // YYYY-MM-DD
	FechaHasta       string // YYYY-MM-DD
	TipoPersona      string
	Documento        string
	Estado           string // abierto | cerrado | todos
	MotivoSalida     string
	SalidaSinIngreso *bool
	Page             int
	PageSize         int
}

// AccesoHistorialItem fila del reporte.
type AccesoHistorialItem struct {
	VisitaID           uint               `json:"visita_id"`
	Persona            AccesoPersonaFicha `json:"persona"`
	TipoPersona        string             `json:"tipo_persona"`
	SedeID             uint               `json:"sede_id"`
	SedeNombre         string             `json:"sede_nombre"`
	RegionalID         *uint              `json:"regional_id,omitempty"`
	RegionalNombre     string             `json:"regional_nombre,omitempty"`
	TimestampEntrada   string             `json:"timestamp_entrada"`
	TimestampSalida    *string            `json:"timestamp_salida,omitempty"`
	MetodoRegistro     string             `json:"metodo_registro"`
	MotivoSalida       string             `json:"motivo_salida,omitempty"`
	ObservacionSalida  string             `json:"observacion_salida,omitempty"`
	SalidaSinIngreso   bool               `json:"salida_sin_ingreso"`
	Estado             string             `json:"estado"` // abierto | cerrado
}

// AccesoHistorialResponse listado paginado.
type AccesoHistorialResponse struct {
	Items      []AccesoHistorialItem `json:"items"`
	Total      int64                 `json:"total"`
	Page       int                   `json:"page"`
	PageSize   int                   `json:"page_size"`
	FechaDesde string                `json:"fecha_desde,omitempty"`
	FechaHasta string                `json:"fecha_hasta,omitempty"`
}

// AccesoHoraBucket conteo por hora del día (0-23).
type AccesoHoraBucket struct {
	Hora int   `json:"hora"`
	N    int64 `json:"n"`
}

// AccesoEstadisticasResponse KPIs del panel.
type AccesoEstadisticasResponse struct {
	FechaDesde             string             `json:"fecha_desde"`
	FechaHasta             string             `json:"fecha_hasta"`
	TotalIngresos          int64              `json:"total_ingresos"`
	TotalSalidas           int64              `json:"total_salidas"`
	DentroAhora            int64              `json:"dentro_ahora"`
	SalidasSinIngreso      int64              `json:"salidas_sin_ingreso"`
	VisitasAbiertasPeriodo int64              `json:"visitas_abiertas_periodo"`
	VisitasCerradasPeriodo int64              `json:"visitas_cerradas_periodo"`
	IndiceSalidaIngreso    float64            `json:"indice_salida_ingreso"`
	HoraPicoIngreso        *int               `json:"hora_pico_ingreso,omitempty"`
	HoraPicoSalida         *int               `json:"hora_pico_salida,omitempty"`
	PorTipoPersona         map[string]int64   `json:"por_tipo_persona"`
	PorMotivoSalida        map[string]int64   `json:"por_motivo_salida"`
	PorMetodo              map[string]int64   `json:"por_metodo"`
	IngresosPorHora        []AccesoHoraBucket `json:"ingresos_por_hora"`
	SalidasPorHora         []AccesoHoraBucket `json:"salidas_por_hora"`
}
