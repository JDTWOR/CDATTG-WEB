/**
 * models: edición de la Revista Rupícola.
 * @author Cristian Deysdayr Jiménez
 */
package models

import "time"

// BiogjgasRevista número publicado de la revista del área.
type BiogjgasRevista struct {
	UserAuditModel
	Slug              string     `gorm:"size:180;not null;uniqueIndex" json:"slug"`
	Titulo            string     `gorm:"size:255;not null" json:"titulo"`
	Volumen           string     `gorm:"size:40" json:"volumen"`
	Numero            string     `gorm:"size:40" json:"numero"`
	Anio              int        `json:"anio"`
	PortadaURL        string     `gorm:"column:portada_url;size:500" json:"portada_url"`
	Editorial         string     `gorm:"type:text" json:"editorial"`
	ISSN              string     `gorm:"size:40" json:"issn"`
	Articulos         string     `gorm:"type:text" json:"articulos"`
	FechaPublicacion  *time.Time `gorm:"column:fecha_publicacion" json:"fecha_publicacion"`
	Orden             int        `gorm:"not null;default:0" json:"orden"`
	EstadoPublicacion string     `gorm:"column:estado_publicacion;size:20;not null;default:borrador" json:"estado_publicacion"`
}

// TableName ediciones de revista.
func (BiogjgasRevista) TableName() string {
	return "biogjgas_revista_ediciones"
}
