package models

import (
	"time"
)

// Importar CentroFormacion (definido en otro archivo del mismo paquete)

// Instructor representa un instructor
type Instructor struct {
	UserAuditModel
	PersonaID              uint       `gorm:"column:persona_id;uniqueIndex;not null" json:"persona_id"`
	RegionalID             *uint      `gorm:"column:regional_id" json:"regional_id"`
	Status                 bool       `gorm:"default:true" json:"status"`
	Especialidades         string     `gorm:"type:json" json:"especialidades"`
	Competencias           string     `gorm:"type:json" json:"competencias"`
	AnosExperiencia        *int       `gorm:"column:anos_experiencia" json:"anos_experiencia"`
	ExperienciaLaboral     string     `gorm:"type:text" json:"experiencia_laboral"`
	NumeroDocumentoCache   string     `gorm:"column:numero_documento_cache;size:20" json:"numero_documento_cache"`
	NombreCompletoCache    string     `gorm:"column:nombre_completo_cache;size:255" json:"nombre_completo_cache"`
	TipoVinculacionID      *uint      `gorm:"column:tipo_vinculacion_id" json:"tipo_vinculacion_id"`
	Jornadas               string     `gorm:"type:json" json:"jornadas"`
	CentroFormacionID      *uint      `gorm:"column:centro_formacion_id" json:"centro_formacion_id"`
	ExperienciaInstructorMeses *int   `gorm:"column:experiencia_instructor_meses" json:"experiencia_instructor_meses"`
	FechaIngresoSena       *time.Time `gorm:"column:fecha_ingreso_sena" json:"fecha_ingreso_sena"`
	NivelAcademicoID       *uint      `gorm:"column:nivel_academico_id" json:"nivel_academico_id"`
	TitulosObtenidos       string     `gorm:"type:json" json:"titulos_obtenidos"`
	InstitucionesEducativas string    `gorm:"type:json" json:"instituciones_educativas"`
	CertificacionesTecnicas string    `gorm:"type:json" json:"certificaciones_tecnicas"`
	CursosComplementarios   string    `gorm:"type:json" json:"cursos_complementarios"`
	FormacionPedagogia      string    `gorm:"type:text" json:"formacion_pedagogia"`
	AreasExperticia         string    `gorm:"type:json" json:"areas_experticia"`
	CompetenciasTic         string    `gorm:"type:json" json:"competencias_tic"`
	Idiomas                 string    `gorm:"type:json" json:"idiomas"`
	HabilidadesPedagogicas  string    `gorm:"type:json" json:"habilidades_pedagogicas"`
	DocumentosAdjuntos      string    `gorm:"type:json" json:"documentos_adjuntos"`
	NumeroContrato          string    `gorm:"column:numero_contrato;size:50" json:"numero_contrato"`
	FechaInicioContrato     *time.Time `gorm:"column:fecha_inicio_contrato" json:"fecha_inicio_contrato"`
	FechaFinContrato        *time.Time `gorm:"column:fecha_fin_contrato" json:"fecha_fin_contrato"`
	SupervisorContrato      string    `gorm:"column:supervisor_contrato;size:255" json:"supervisor_contrato"`
	EPS                     string    `gorm:"size:100" json:"eps"`
	ARL                     string    `gorm:"size:100" json:"arl"`
	
	// Relaciones
	Persona         *Persona         `gorm:"foreignKey:PersonaID" json:"persona,omitempty"`
	Regional        *Regional        `gorm:"foreignKey:RegionalID" json:"regional,omitempty"`
	CentroFormacion *CentroFormacion `gorm:"foreignKey:CentroFormacionID" json:"centro_formacion,omitempty"`
	Fichas          []FichaCaracterizacion `gorm:"foreignKey:InstructorID" json:"fichas,omitempty"`
}

// TableName especifica el nombre de la tabla
func (Instructor) TableName() string {
	return "instructors"
}
