package complementarios

import "github.com/sena/cdattg-web-golang/models"

// ComplementarioCatalogo representa el catálogo de programas complementarios
type ComplementarioCatalogo struct {
	models.BaseModel
	PrfCodigo         string `gorm:"size:50;not null" json:"prf_codigo"`
	Version           int    `gorm:"not null" json:"version"`
	CodVer            string `gorm:"size:50" json:"cod_ver"`
	Denominacion      string `gorm:"size:255;not null" json:"denominacion"`
	NivelFormacion    string `gorm:"size:100" json:"nivel_formacion"`
	DuracionHoras     int    `gorm:"column:duracion_horas" json:"duracion_horas"`
	RequisitosIngreso string `gorm:"type:text" json:"requisitos_ingreso"`
	LineaTecnologica  string `gorm:"size:255" json:"linea_tecnologica"`
	RedTecnologica    string `gorm:"size:255" json:"red_tecnologica"`
	RedConocimiento   string `gorm:"size:255" json:"red_conocimiento"`
	ModalidadID       *uint  `gorm:"column:modalidad_id" json:"modalidad_id"`
	ApuestaPrioritaria string `gorm:"size:255" json:"apuesta_prioritaria"`
	TipoPermiso       string `gorm:"size:100" json:"tipo_permiso"`
	MultipleInscripcion bool `gorm:"default:false" json:"multiple_inscripcion"`
	Alamedida         bool   `gorm:"default:false" json:"alamedida"`
	FIC               bool   `gorm:"default:false" json:"fic"`
	Creditos          *int   `json:"creditos"`
	Indice            string `gorm:"size:100" json:"indice"`
	Ocupacion         string `gorm:"size:255" json:"ocupacion"`
	Activo            bool   `gorm:"default:true" json:"activo"`
	
	// Relaciones
	Modalidad *models.Modalidad `gorm:"foreignKey:ModalidadID" json:"modalidad,omitempty"`
	Complementarios []ComplementarioOfertado `gorm:"foreignKey:CatalogoID" json:"complementarios,omitempty"`
}

// TableName especifica el nombre de la tabla
func (ComplementarioCatalogo) TableName() string {
	return "complementarios_catalogo"
}
