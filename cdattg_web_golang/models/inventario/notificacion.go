package inventario

import (
	"time"

	"github.com/sena/cdattg-web-golang/models"
)

// Notificacion representa una notificación del sistema (nueva orden, stock bajo, aprobación/rechazo, devolución)
type Notificacion struct {
	models.BaseModel
	NotificableType string     `gorm:"column:notificable_type;size:255;not null" json:"notificable_type"`
	NotificableID   uint       `gorm:"column:notificable_id;not null" json:"notificable_id"`
	RecipientUserID *uint      `gorm:"column:recipient_user_id" json:"recipient_user_id,omitempty"` // usuario que recibe la notificación
	Tipo             string    `gorm:"size:50;not null" json:"tipo"`
	Titulo           string    `gorm:"size:255;not null" json:"titulo"`
	Mensaje          string    `gorm:"type:text;not null" json:"mensaje"`
	LeidaEn          *time.Time `gorm:"column:leida_en" json:"leida_en"`
	Data             string    `gorm:"type:json" json:"data"`
}

// TableName especifica el nombre de la tabla
func (Notificacion) TableName() string {
	return "notificaciones"
}
