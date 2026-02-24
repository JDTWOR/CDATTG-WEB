package inventario

import "github.com/sena/cdattg-web-golang/models"

// Estados de detalle de orden según documentación
const (
	DetalleEstadoEnEspera  = "EN_ESPERA"
	DetalleEstadoAprobada  = "APROBADA"
	DetalleEstadoRechazada = "RECHAZADA"
)

// DetalleOrden representa el detalle de productos en una orden
type DetalleOrden struct {
	models.BaseModel
	OrdenID         uint   `gorm:"column:orden_id;not null" json:"orden_id"`
	ProductoID      uint   `gorm:"column:producto_id;not null" json:"producto_id"`
	Cantidad        int    `gorm:"not null" json:"cantidad"`
	CantidadDevuelta int   `gorm:"column:cantidad_devuelta;default:0" json:"cantidad_devuelta"`
	EstadoOrdenID   *uint  `gorm:"column:estado_orden_id" json:"estado_orden_id,omitempty"`
	Estado          string `gorm:"size:50;default:EN_ESPERA;not null" json:"estado"` // EN_ESPERA, APROBADA, RECHAZADA
	Observaciones   string `gorm:"type:text" json:"observaciones"`
	CierraSinStock  bool   `gorm:"column:cierra_sin_stock;default:false" json:"cierra_sin_stock"` // true si se registró cierre sin stock (solo consumibles)

	// Relaciones
	Orden    *Orden    `gorm:"foreignKey:OrdenID" json:"orden,omitempty"`
	Producto *Producto `gorm:"foreignKey:ProductoID" json:"producto,omitempty"`
}

// TableName especifica el nombre de la tabla
func (DetalleOrden) TableName() string {
	return "detalle_ordenes"
}
