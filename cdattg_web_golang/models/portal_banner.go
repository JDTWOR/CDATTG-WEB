/**
 * models: banner de la vitrina pública (imágenes y vigencia).
 * @author Cristian Deysdayr Jiménez
 */
package models

import "time"

// PortalBanner imagen o aviso del home público.
type PortalBanner struct {
	UserAuditModel
	Titulo            string     `gorm:"size:255;not null" json:"titulo"`
	Descripcion       string     `gorm:"type:text" json:"descripcion"`
	ImagenURL         string     `gorm:"column:imagen_url;size:500" json:"imagen_url"`
	Etiqueta          string     `gorm:"size:80" json:"etiqueta"`
	BotonTexto        string     `gorm:"column:boton_texto;size:80" json:"boton_texto"`
	EnlaceURL         string     `gorm:"column:enlace_url;size:500" json:"enlace_url"`
	Orden              int        `gorm:"not null;default:0" json:"orden"`
	VigenteDesde       *time.Time `gorm:"column:vigente_desde" json:"vigente_desde"`
	VigenteHasta       *time.Time `gorm:"column:vigente_hasta" json:"vigente_hasta"`
	EstadoPublicacion  string     `gorm:"column:estado_publicacion;size:20;not null;default:borrador" json:"estado_publicacion"`
}

// TableName tabla de banners.
func (PortalBanner) TableName() string {
	return "portal_banners"
}
