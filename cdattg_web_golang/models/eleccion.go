package models

import "time"

// Estados del proceso electoral.
const (
	EleccionEstadoBorrador         = "borrador"
	EleccionEstadoInscripcion      = "inscripcion"
	EleccionEstadoVotacion         = "votacion"
	EleccionEstadoEmpatePendiente  = "empate_pendiente"
	EleccionEstadoCerrada          = "cerrada"
)

// Estados de plancha.
const (
	PlanchaEstadoPendiente  = "pendiente_confirmacion"
	PlanchaEstadoConfirmada = "confirmada"
	PlanchaEstadoRechazada  = "rechazada"
	PlanchaEstadoRetirada   = "retirada"
)

// EleccionProceso ciclo electoral anual por regional.
type EleccionProceso struct {
	UserAuditModel
	RegionalID             uint       `gorm:"column:regional_id;not null;uniqueIndex:uk_eleccion_regional_anio" json:"regional_id"`
	Anio                   int        `gorm:"column:anio;not null;uniqueIndex:uk_eleccion_regional_anio" json:"anio"`
	NombreCiclo            string     `gorm:"column:nombre_ciclo;size:120;not null" json:"nombre_ciclo"`
	Estado                 string     `gorm:"column:estado;size:32;not null;default:borrador" json:"estado"`
	FechaInscripcionInicio *time.Time `gorm:"column:fecha_inscripcion_inicio" json:"fecha_inscripcion_inicio,omitempty"`
	FechaInscripcionFin    *time.Time `gorm:"column:fecha_inscripcion_fin" json:"fecha_inscripcion_fin,omitempty"`
	FechaVotacionInicio    *time.Time `gorm:"column:fecha_votacion_inicio" json:"fecha_votacion_inicio,omitempty"`
	FechaVotacionFin       *time.Time `gorm:"column:fecha_votacion_fin" json:"fecha_votacion_fin,omitempty"`
	MinDiasMatricula       *int       `gorm:"column:min_dias_matricula" json:"min_dias_matricula,omitempty"`

	Regional *Regional `gorm:"foreignKey:RegionalID" json:"regional,omitempty"`
}

func (EleccionProceso) TableName() string { return "eleccion_procesos" }

// EleccionPlancha titular + suplente postulados juntos.
type EleccionPlancha struct {
	UserAuditModel
	ProcesoID            uint       `gorm:"column:proceso_id;not null;index" json:"proceso_id"`
	TitularAprendizID    uint       `gorm:"column:titular_aprendiz_id;not null" json:"titular_aprendiz_id"`
	SuplenteAprendizID   uint       `gorm:"column:suplente_aprendiz_id;not null" json:"suplente_aprendiz_id"`
	Estado               string     `gorm:"column:estado;size:32;not null" json:"estado"`
	TitularConfirmadoAt  *time.Time `gorm:"column:titular_confirmado_at" json:"titular_confirmado_at,omitempty"`
	SuplenteConfirmadoAt *time.Time `gorm:"column:suplente_confirmado_at" json:"suplente_confirmado_at,omitempty"`
	PropuestaPorUserID   *uint      `gorm:"column:propuesta_por_user_id" json:"propuesta_por_user_id,omitempty"`
	MotivoRechazo        *string    `gorm:"column:motivo_rechazo;size:500" json:"motivo_rechazo,omitempty"`

	Proceso          *EleccionProceso `gorm:"foreignKey:ProcesoID" json:"proceso,omitempty"`
	TitularAprendiz  *Aprendiz        `gorm:"foreignKey:TitularAprendizID" json:"titular_aprendiz,omitempty"`
	SuplenteAprendiz *Aprendiz        `gorm:"foreignKey:SuplenteAprendizID" json:"suplente_aprendiz,omitempty"`
}

func (EleccionPlancha) TableName() string { return "eleccion_planchas" }

// EleccionVoto registro transparente (quién votó y por qué plancha).
type EleccionVoto struct {
	BaseModel
	ProcesoID         uint `gorm:"column:proceso_id;not null;uniqueIndex:idx_eleccion_voto_proceso_user" json:"proceso_id"`
	PlanchaID         uint `gorm:"column:plancha_id;not null" json:"plancha_id"`
	VotanteUserID     uint `gorm:"column:votante_user_id;not null;uniqueIndex:idx_eleccion_voto_proceso_user" json:"votante_user_id"`
	VotanteAprendizID uint `gorm:"column:votante_aprendiz_id;not null" json:"votante_aprendiz_id"`

	Proceso         *EleccionProceso `gorm:"foreignKey:ProcesoID" json:"proceso,omitempty"`
	Plancha         *EleccionPlancha `gorm:"foreignKey:PlanchaID" json:"plancha,omitempty"`
	VotanteAprendiz *Aprendiz        `gorm:"foreignKey:VotanteAprendizID" json:"votante_aprendiz,omitempty"`
}

func (EleccionVoto) TableName() string { return "eleccion_votos" }

// EleccionResultado conteo y ganador del proceso.
type EleccionResultado struct {
	BaseModel
	ProcesoID         uint    `gorm:"column:proceso_id;not null;uniqueIndex" json:"proceso_id"`
	PlanchaGanadoraID *uint   `gorm:"column:plancha_ganadora_id" json:"plancha_ganadora_id,omitempty"`
	VotosTotales      int     `gorm:"column:votos_totales;not null;default:0" json:"votos_totales"`
	DetalleJSON       string  `gorm:"column:detalle_json;type:text" json:"detalle_json"`
	Empate            bool    `gorm:"column:empate;not null;default:false" json:"empate"`
	NotaDesempate     *string `gorm:"column:nota_desempate;type:text" json:"nota_desempate,omitempty"`
	UserRegistroID    *uint   `gorm:"column:user_registro_id" json:"user_registro_id,omitempty"`

	Proceso         *EleccionProceso `gorm:"foreignKey:ProcesoID" json:"proceso,omitempty"`
	PlanchaGanadora *EleccionPlancha `gorm:"foreignKey:PlanchaGanadoraID" json:"plancha_ganadora,omitempty"`
}

func (EleccionResultado) TableName() string { return "eleccion_resultados" }

// RepresentanteAprendiz vigencia histórica y actual por regional.
type RepresentanteAprendiz struct {
	BaseModel
	RegionalID           uint       `gorm:"column:regional_id;not null;index" json:"regional_id"`
	ProcesoID            uint       `gorm:"column:proceso_id;not null" json:"proceso_id"`
	TitularAprendizID    uint       `gorm:"column:titular_aprendiz_id;not null" json:"titular_aprendiz_id"`
	SuplenteAprendizID   uint       `gorm:"column:suplente_aprendiz_id;not null" json:"suplente_aprendiz_id"`
	VigenciaDesde        time.Time  `gorm:"column:vigencia_desde;not null" json:"vigencia_desde"`
	VigenciaHasta        *time.Time `gorm:"column:vigencia_hasta" json:"vigencia_hasta,omitempty"`

	Regional         *Regional        `gorm:"foreignKey:RegionalID" json:"regional,omitempty"`
	Proceso          *EleccionProceso `gorm:"foreignKey:ProcesoID" json:"proceso,omitempty"`
	TitularAprendiz  *Aprendiz        `gorm:"foreignKey:TitularAprendizID" json:"titular_aprendiz,omitempty"`
	SuplenteAprendiz *Aprendiz        `gorm:"foreignKey:SuplenteAprendizID" json:"suplente_aprendiz,omitempty"`
}

func (RepresentanteAprendiz) TableName() string { return "representantes_aprendiz" }
