package complementarios

import (
	"time"

	"github.com/sena/cdattg-web-golang/models"
)

// SenasofiaplusValidationLog representa un log de validación en SENASOFIAPLUS
type SenasofiaplusValidationLog struct {
	models.BaseModel
	AspiranteComplementarioID uint      `gorm:"column:aspirante_complementario_id;not null" json:"aspirante_complementario_id"`
	Accion                    string    `gorm:"size:50;not null" json:"accion"`
	RequestData               string    `gorm:"type:json" json:"request_data"`
	ResponseData              string    `gorm:"type:json" json:"response_data"`
	Status                    string    `gorm:"size:50" json:"status"` // SUCCESS, ERROR
	Mensaje                   string    `gorm:"type:text" json:"mensaje"`
	FechaValidacion           time.Time `gorm:"column:fecha_validacion;not null" json:"fecha_validacion"`
	
	// Relaciones
	AspiranteComplementario *AspiranteComplementario `gorm:"foreignKey:AspiranteComplementarioID" json:"aspirante_complementario,omitempty"`
}

// TableName especifica el nombre de la tabla
func (SenasofiaplusValidationLog) TableName() string {
	return "senasofiaplus_validation_logs"
}
