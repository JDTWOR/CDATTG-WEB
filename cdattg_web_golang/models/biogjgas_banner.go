/**
 * models: banner del home de Investigación (BIOGIGAS), no el carrusel SENA.
 * @author Cristian Deysdayr Jiménez
 */
package models

import "time"

// BiogjgasBanner diapositiva vigente del portal de investigación.
type BiogjgasBanner struct {
	UserAuditModel
	Titulo            string     `gorm:"size:255;not null" json:"titulo"`
	Subtitulo         string     `gorm:"type:text" json:"subtitulo"`
	ImagenURL         string     `gorm:"column:imagen_url;size:500" json:"imagen_url"`
	EnlaceURL         string     `gorm:"column:enlace_url;size:500" json:"enlace_url"`
	Orden             int        `gorm:"not null;default:0" json:"orden"`
	VigenteDesde      *time.Time `gorm:"column:vigente_desde" json:"vigente_desde"`
	VigenteHasta      *time.Time `gorm:"column:vigente_hasta" json:"vigente_hasta"`
	EstadoPublicacion string     `gorm:"column:estado_publicacion;size:20;not null;default:borrador" json:"estado_publicacion"`
}

// TableName banners del área de investigación.
func (BiogjgasBanner) TableName() string {
	return "biogjgas_banners"
}
