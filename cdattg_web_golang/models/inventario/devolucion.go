package inventario

import (
	"time"

	"github.com/sena/cdattg-web-golang/models"
)

// Devolucion representa una devolución de productos (por detalle de orden, según documentación)
type Devolucion struct {
	models.UserAuditModel
	DetalleOrdenID   uint       `gorm:"column:detalle_orden_id;not null" json:"detalle_orden_id"`
	CantidadDevuelta int        `gorm:"column:cantidad_devuelta;not null" json:"cantidad_devuelta"` // ≥0; 0 solo si cierre sin stock (consumibles)
	CierraSinStock   bool       `gorm:"column:cierra_sin_stock;default:false" json:"cierra_sin_stock"`
	FechaDevolucion  time.Time  `gorm:"column:fecha_devolucion;not null" json:"fecha_devolucion"`
	Observaciones    string     `gorm:"type:text" json:"observaciones"` // obligatorias en cierre sin stock

	// Relaciones
	DetalleOrden *DetalleOrden `gorm:"foreignKey:DetalleOrdenID" json:"detalle_orden,omitempty"`
}

// TableName especifica el nombre de la tabla
func (Devolucion) TableName() string {
	return "devoluciones"
}
