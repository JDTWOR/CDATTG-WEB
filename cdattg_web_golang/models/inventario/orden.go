package inventario

import (
	"time"

	"github.com/sena/cdattg-web-golang/models"
)

// Estados de orden
const (
	OrdenEstadoEnEspera   = "EN_ESPERA"
	OrdenEstadoPendiente  = "PENDIENTE"
	OrdenEstadoCompletada = "COMPLETADA"
)

// Orden representa una orden de préstamo/salida (documentación: descripción obligatoria, tipo préstamo/salida)
type Orden struct {
	models.UserAuditModel
	NumeroOrden       string     `gorm:"size:50;uniqueIndex;not null" json:"numero_orden"`
	TipoOrden         string     `gorm:"size:50;not null" json:"tipo_orden"` // PRESTAMO, SALIDA
	Descripcion       string     `gorm:"type:text;not null" json:"descripcion"`
	FechaOrden        time.Time  `gorm:"column:fecha_orden;not null" json:"fecha_orden"`
	FechaDevolucion   *time.Time `gorm:"column:fecha_devolucion" json:"fecha_devolucion"` // obligatoria si tipo=PRESTAMO, debe ser > hoy
	Estado            string     `gorm:"size:50;default:EN_ESPERA;not null" json:"estado"`
	Observaciones     string     `gorm:"type:text" json:"observaciones"`
	PersonaID         uint       `gorm:"column:persona_id;not null" json:"persona_id"`
	AmbienteID        *uint      `gorm:"column:ambiente_id" json:"ambiente_id"`
	RolID             *uint      `gorm:"column:rol_id" json:"rol_id,omitempty"`             // opcional; desde carrito
	ProgramaFormacionID *uint    `gorm:"column:programa_formacion_id" json:"programa_formacion_id,omitempty"`

	// Relaciones
	Persona          *models.Persona   `gorm:"foreignKey:PersonaID" json:"persona,omitempty"`
	Ambiente         *models.Ambiente `gorm:"foreignKey:AmbienteID" json:"ambiente,omitempty"`
	DetalleOrdenes   []DetalleOrden   `gorm:"foreignKey:OrdenID" json:"detalle_ordenes,omitempty"`
	Aprobaciones     []Aprobacion    `gorm:"foreignKey:OrdenID" json:"aprobaciones,omitempty"`
}

// TableName especifica el nombre de la tabla
func (Orden) TableName() string {
	return "ordenes"
}
