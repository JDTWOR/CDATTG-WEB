/**
 * models: actividad del área (opcionalmente ligada a un semillero).
 * @author Cristian Deysdayr Jiménez
 */
package models

import "time"

// BiogjgasActividad evento o actividad de investigación.
type BiogjgasActividad struct {
	UserAuditModel
	Titulo            string     `gorm:"size:255;not null" json:"titulo"`
	Tipo              string     `gorm:"size:80" json:"tipo"`
	Fecha             *time.Time `json:"fecha"`
	Lugar             string     `gorm:"size:255" json:"lugar"`
	Modalidad         string     `gorm:"size:80" json:"modalidad"`
	Descripcion       string     `gorm:"type:text" json:"descripcion"`
	SemilleroID       *uint      `gorm:"column:semillero_id;index" json:"semillero_id"`
	EstadoActividad   string     `gorm:"column:estado_actividad;size:40" json:"estado_actividad"`
	Orden             int        `gorm:"not null;default:0" json:"orden"`
	EstadoPublicacion string     `gorm:"column:estado_publicacion;size:20;not null;default:borrador" json:"estado_publicacion"`
}

// TableName actividades BIOGIGAS.
func (BiogjgasActividad) TableName() string {
	return "biogjgas_actividades"
}
