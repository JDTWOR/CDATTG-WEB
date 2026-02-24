package inventario

import (
	"time"

	"github.com/sena/cdattg-web-golang/models"
)

// ContratoConvenio representa un contrato o convenio
type ContratoConvenio struct {
	models.UserAuditModel
	NumeroContrato string     `gorm:"size:100;uniqueIndex;not null" json:"numero_contrato"`
	Nombre         string     `gorm:"size:255;not null" json:"nombre"`
	FechaInicio    time.Time  `gorm:"column:fecha_inicio;not null" json:"fecha_inicio"`
	FechaFin       time.Time  `gorm:"column:fecha_fin;not null" json:"fecha_fin"`
	Valor          *float64   `json:"valor"`
	Observaciones  string     `gorm:"type:text" json:"observaciones"`
	Status         bool       `gorm:"default:true" json:"status"`
	
	// Relaciones
	Productos []Producto `gorm:"foreignKey:ContratoConvenioID" json:"productos,omitempty"`
}

// TableName especifica el nombre de la tabla
func (ContratoConvenio) TableName() string {
	return "contratos_convenios"
}
