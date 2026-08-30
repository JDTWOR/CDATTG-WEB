// @module personal_administrativo
// @description Modelo de base de datos para la entidad Personal Administrativo.
// @author JDTWOR
// @created 2026-08-14
package models

// PersonalAdministrativo representa una persona vinculada como personal administrativo.
type PersonalAdministrativo struct {
	UserAuditModel
	PersonaID            uint     `gorm:"column:persona_id;uniqueIndex;not null" json:"persona_id"`
	Status               bool     `gorm:"default:true" json:"status"`
	NumeroDocumentoCache string   `gorm:"column:numero_documento_cache;size:20" json:"numero_documento_cache"`
	NombreCompletoCache  string   `gorm:"column:nombre_completo_cache;size:255" json:"nombre_completo_cache"`

	// Relaciones
	Persona *Persona `gorm:"foreignKey:PersonaID" json:"persona,omitempty"`
}

// TableName especifica el nombre de la tabla
func (PersonalAdministrativo) TableName() string {
	return "personal_administrativo"
}