/**
 * models: boletín del área de investigación.
 * @author Cristian Deysdayr Jiménez
 */
package models

import "time"

// BiogjgasBoletin comunicado o boletín descargable.
type BiogjgasBoletin struct {
	UserAuditModel
	Titulo            string     `gorm:"size:255;not null" json:"titulo"`
	Numero            string     `gorm:"size:40" json:"numero"`
	Fecha             *time.Time `json:"fecha"`
	Resumen           string     `gorm:"type:text" json:"resumen"`
	PDFURL            string     `gorm:"column:pdf_url;size:500" json:"pdf_url"`
	PortadaURL        string     `gorm:"column:portada_url;size:500" json:"portada_url"`
	Tematica          string     `gorm:"size:255" json:"tematica"`
	Orden             int        `gorm:"not null;default:0" json:"orden"`
	EstadoPublicacion string     `gorm:"column:estado_publicacion;size:20;not null;default:borrador" json:"estado_publicacion"`
}

// TableName boletines BIOGIGAS.
func (BiogjgasBoletin) TableName() string {
	return "biogjgas_boletines"
}
