package inventario

import (
	"time"

	"github.com/sena/cdattg-web-golang/models"
)

// Aprobacion representa una aprobación o rechazo (por detalle o por orden completa)
type Aprobacion struct {
	models.BaseModel
	OrdenID         uint       `gorm:"column:orden_id;not null" json:"orden_id"`
	DetalleOrdenID  *uint      `gorm:"column:detalle_orden_id" json:"detalle_orden_id,omitempty"` // nil = aprobación/rechazo de orden completa
	UserID          uint       `gorm:"column:user_id;not null" json:"user_id"`
	Estado          string     `gorm:"size:50;not null" json:"estado"` // APROBADA, RECHAZADA
	FechaAprobacion time.Time  `gorm:"column:fecha_aprobacion;not null" json:"fecha_aprobacion"`
	Observaciones   string     `gorm:"type:text" json:"observaciones"` // motivo en rechazo

	// Relaciones
	Orden        *Orden        `gorm:"foreignKey:OrdenID" json:"orden,omitempty"`
	DetalleOrden *DetalleOrden `gorm:"foreignKey:DetalleOrdenID" json:"detalle_orden,omitempty"`
	User         *models.User  `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// TableName especifica el nombre de la tabla
func (Aprobacion) TableName() string {
	return "aprobaciones"
}
