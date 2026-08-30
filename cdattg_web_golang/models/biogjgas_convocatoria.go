/**
 * models: convocatoria del área (opcionalmente ligada a un semillero).
 * @author Cristian Deysdayr Jiménez
 */
package models

import "time"

// BiogjgasConvocatoria llamado a participar en investigación.
type BiogjgasConvocatoria struct {
	UserAuditModel
	Titulo              string     `gorm:"size:255;not null" json:"titulo"`
	Tipo                string     `gorm:"size:80" json:"tipo"`
	Descripcion         string     `gorm:"type:text" json:"descripcion"`
	Requisitos          string     `gorm:"type:text" json:"requisitos"`
	FechaApertura       *time.Time `gorm:"column:fecha_apertura" json:"fecha_apertura"`
	FechaCierre         *time.Time `gorm:"column:fecha_cierre" json:"fecha_cierre"`
	DocumentoURL        string     `gorm:"column:documento_url;size:500" json:"documento_url"`
	EnlaceExterno       string     `gorm:"column:enlace_externo;size:500" json:"enlace_externo"`
	EstadoConvocatoria  string     `gorm:"column:estado_convocatoria;size:40" json:"estado_convocatoria"`
	SemilleroID         *uint      `gorm:"column:semillero_id;index" json:"semillero_id"`
	Orden               int        `gorm:"not null;default:0" json:"orden"`
	EstadoPublicacion   string     `gorm:"column:estado_publicacion;size:20;not null;default:borrador" json:"estado_publicacion"`
}

// TableName convocatorias BIOGIGAS.
func (BiogjgasConvocatoria) TableName() string {
	return "biogjgas_convocatorias"
}
