package complementarios

import (
	"time"

	"github.com/sena/cdattg-web-golang/models"
)

// SofiaValidationProgress representa el progreso de validación en SOFIA
type SofiaValidationProgress struct {
	models.BaseModel
	AspiranteComplementarioID uint      `gorm:"column:aspirante_complementario_id;not null" json:"aspirante_complementario_id"`
	Estado                    string    `gorm:"size:50;not null" json:"estado"`
	Progreso                  int       `gorm:"default:0" json:"progreso"` // 0-100
	Mensaje                   string    `gorm:"type:text" json:"mensaje"`
	FechaValidacion           time.Time `gorm:"column:fecha_validacion;not null" json:"fecha_validacion"`
	
	// Relaciones
	AspiranteComplementario *AspiranteComplementario `gorm:"foreignKey:AspiranteComplementarioID" json:"aspirante_complementario,omitempty"`
}

// TableName especifica el nombre de la tabla
func (SofiaValidationProgress) TableName() string {
	return "sofia_validation_progress"
}
