package complementarios

import (
	"time"

	"github.com/sena/cdattg-web-golang/models"
)

// ComplementarioOfertado representa un programa complementario ofertado
type ComplementarioOfertado struct {
	models.UserAuditModel
	Codigo            string     `gorm:"size:50;uniqueIndex;not null" json:"codigo"`
	Nombre            string     `gorm:"size:255;not null" json:"nombre"`
	Justificacion     string     `gorm:"type:text" json:"justificacion"`
	RequisitosIngreso string     `gorm:"type:text" json:"requisitos_ingreso"`
	Duracion          int        `gorm:"not null" json:"duracion"` // horas
	Cupos             int        `gorm:"default:0" json:"cupos"`
	Estado            int        `gorm:"default:0" json:"estado"` // 0=borrador, 1=activo, 2=finalizado
	ModalidadID       *uint      `gorm:"column:modalidad_id" json:"modalidad_id"`
	JornadaID         *uint      `gorm:"column:jornada_id" json:"jornada_id"`
	AmbienteID        *uint      `gorm:"column:ambiente_id" json:"ambiente_id"`
	AmbienteComentario string    `gorm:"type:text" json:"ambiente_comentario"`
	CatalogoID        *uint      `gorm:"column:catalogo_id" json:"catalogo_id"`
	FechaInicio       *time.Time `gorm:"column:fecha_inicio" json:"fecha_inicio"`
	FechaFin          *time.Time `gorm:"column:fecha_fin" json:"fecha_fin"`
	
	// Relaciones
	Modalidad         *models.Modalidad `gorm:"foreignKey:ModalidadID" json:"modalidad,omitempty"`
	Jornada           *models.Jornada   `gorm:"foreignKey:JornadaID" json:"jornada,omitempty"`
	Ambiente          *models.Ambiente      `gorm:"foreignKey:AmbienteID" json:"ambiente,omitempty"`
	Catalogo          *ComplementarioCatalogo `gorm:"foreignKey:CatalogoID" json:"catalogo,omitempty"`
	Aspirantes        []AspiranteComplementario `gorm:"foreignKey:ComplementarioID" json:"aspirantes,omitempty"`
	// Relaciones ManyToMany (comentadas para evitar problemas de inicialización)
	// DiasFormacion     []models.DiasFormacion `gorm:"many2many:complementarios_ofertados_dias_formacion" json:"dias_formacion,omitempty"`
	// Competencias      []models.Competencia  `gorm:"many2many:competencia_complementario" json:"competencias,omitempty"`
	// ResultadosAprendizaje []models.ResultadosAprendizaje `gorm:"many2many:resultado_aprendizaje_complementario" json:"resultados_aprendizaje,omitempty"`
	// GuiasAprendizaje  []models.GuiasAprendizaje `gorm:"many2many:guia_aprendizaje_complementario" json:"guias_aprendizaje,omitempty"`
}

// TableName especifica el nombre de la tabla
func (ComplementarioOfertado) TableName() string {
	return "complementarios_ofertados"
}
