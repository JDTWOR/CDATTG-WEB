package complementarios

import (
	"time"

	"github.com/sena/cdattg-web-golang/models"
)

// AspiranteComplementario representa un aspirante a programa complementario
type AspiranteComplementario struct {
	models.BaseModel
	PersonaID            uint       `gorm:"column:persona_id;not null" json:"persona_id"`
	ComplementarioID     uint       `gorm:"column:complementario_id;not null" json:"complementario_id"`
	Estado               int        `gorm:"default:1" json:"estado"` // 1=inscrito, 2=aprobado, 3=rechazado, 4=matriculado
	Observaciones        string     `gorm:"type:text" json:"observaciones"`
	DocumentoIdentidadPath string   `gorm:"column:documento_identidad_path;size:500" json:"documento_identidad_path"`
	DocumentoIdentidadNombre string `gorm:"column:documento_identidad_nombre;size:255" json:"documento_identidad_nombre"`
	FechaInscripcion     time.Time  `gorm:"column:fecha_inscripcion;not null" json:"fecha_inscripcion"`
	
	// Relaciones
	Persona        *models.Persona        `gorm:"foreignKey:PersonaID" json:"persona,omitempty"`
	Complementario *ComplementarioOfertado `gorm:"foreignKey:ComplementarioID" json:"complementario,omitempty"`
}

// TableName especifica el nombre de la tabla
func (AspiranteComplementario) TableName() string {
	return "aspirantes_complementarios"
}
