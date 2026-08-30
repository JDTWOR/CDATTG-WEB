/**
 * models: presentación institucional del portal (misión, visión, historia).
 * @author Cristian Deysdayr Jiménez
 */
package models

// PortalPresentacion contenido único de la página de presentación.
type PortalPresentacion struct {
	UserAuditModel
	Mision            string `gorm:"type:text" json:"mision"`
	Vision            string `gorm:"type:text" json:"vision"`
	ObjetivoGeneral   string `gorm:"column:objetivo_general;type:text" json:"objetivo_general"`
	Historia          string `gorm:"type:text" json:"historia"`
	VideoURL          string `gorm:"column:video_url;size:500" json:"video_url"`
	PoliticasPDF      string `gorm:"column:politicas_pdf;size:500" json:"politicas_pdf"`
	Equipo            string `gorm:"type:text" json:"equipo"`
	EstadoPublicacion string `gorm:"column:estado_publicacion;size:20;not null;default:borrador" json:"estado_publicacion"`
}

// TableName tabla singleton de presentación.
func (PortalPresentacion) TableName() string {
	return "portal_presentacion"
}
