/**
 * models: proyecto asociado a un semillero.
 * @author Cristian Deysdayr Jiménez
 */
package models

import "time"

// SemilleroProyecto trabajo o producto de investigación.
type SemilleroProyecto struct {
	UserAuditModel
	SemilleroID       uint       `gorm:"column:semillero_id;not null;index" json:"semillero_id"`
	Titulo            string     `gorm:"size:255;not null" json:"titulo"`
	Resumen           string     `gorm:"type:text" json:"resumen"`
	Descripcion       string     `gorm:"type:text" json:"descripcion"`
	EstadoEjecucion   string     `gorm:"column:estado_ejecucion;size:40" json:"estado_ejecucion"`
	FechaInicio       *time.Time `gorm:"column:fecha_inicio" json:"fecha_inicio"`
	FechaFin          *time.Time `gorm:"column:fecha_fin" json:"fecha_fin"`
	Anio              int        `json:"anio"`
	Orden             int        `gorm:"not null;default:0" json:"orden"`
	EstadoPublicacion string     `gorm:"column:estado_publicacion;size:20;not null;default:publicado" json:"estado_publicacion"`
}

// TableName tabla de proyectos.
func (SemilleroProyecto) TableName() string {
	return "semillero_proyectos"
}
