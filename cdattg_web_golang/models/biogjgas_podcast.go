/**
 * models: episodio de podcast del área de investigación.
 * @author Cristian Deysdayr Jiménez
 */
package models

import "time"

// BiogjgasPodcast episodio con audio y ficha.
type BiogjgasPodcast struct {
	UserAuditModel
	Titulo            string     `gorm:"size:255;not null" json:"titulo"`
	Descripcion       string     `gorm:"type:text" json:"descripcion"`
	AudioURL          string     `gorm:"column:audio_url;size:500" json:"audio_url"`
	Duracion          string     `gorm:"size:40" json:"duracion"`
	Invitados         string     `gorm:"type:text" json:"invitados"`
	PortadaURL        string     `gorm:"column:portada_url;size:500" json:"portada_url"`
	Fecha             *time.Time `json:"fecha"`
	Orden             int        `gorm:"not null;default:0" json:"orden"`
	EstadoPublicacion string     `gorm:"column:estado_publicacion;size:20;not null;default:borrador" json:"estado_publicacion"`
}

// TableName podcasts BIOGIGAS.
func (BiogjgasPodcast) TableName() string {
	return "biogjgas_podcasts"
}
