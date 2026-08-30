/**
 * models: línea de investigación de un semillero.
 * @author Cristian Deysdayr Jiménez
 */
package models

// SemilleroLinea eje temático del semillero.
type SemilleroLinea struct {
	UserAuditModel
	SemilleroID       uint   `gorm:"column:semillero_id;not null;index" json:"semillero_id"`
	Nombre            string `gorm:"size:255;not null" json:"nombre"`
	Descripcion       string `gorm:"type:text" json:"descripcion"`
	Orden             int    `gorm:"not null;default:0" json:"orden"`
	EstadoPublicacion string `gorm:"column:estado_publicacion;size:20;not null;default:publicado" json:"estado_publicacion"`
}

// TableName tabla de líneas.
func (SemilleroLinea) TableName() string {
	return "semillero_lineas"
}
