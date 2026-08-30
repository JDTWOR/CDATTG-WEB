/**
 * models: integrante de un semillero (aprendiz, instructor u otro).
 * @author Cristian Deysdayr Jiménez
 */
package models

// SemilleroIntegrante persona visible en la ficha pública.
type SemilleroIntegrante struct {
	UserAuditModel
	SemilleroID       uint   `gorm:"column:semillero_id;not null;index" json:"semillero_id"`
	Nombre            string `gorm:"size:255;not null" json:"nombre"`
	Rol               string `gorm:"size:120" json:"rol"`
	Programa          string `gorm:"size:255" json:"programa"`
	Correo            string `gorm:"size:150" json:"correo"`
	Orden             int    `gorm:"not null;default:0" json:"orden"`
	EstadoPublicacion string `gorm:"column:estado_publicacion;size:20;not null;default:publicado" json:"estado_publicacion"`
}

// TableName tabla de integrantes.
func (SemilleroIntegrante) TableName() string {
	return "semillero_integrantes"
}
