package models

// Aprendiz representa un aprendiz
type Aprendiz struct {
	UserAuditModel
	PersonaID            uint `gorm:"column:persona_id;not null" json:"persona_id"`
	FichaCaracterizacionID uint `gorm:"column:ficha_caracterizacion_id;not null" json:"ficha_caracterizacion_id"`
	Estado               bool `gorm:"default:true" json:"estado"`
	
	// Relaciones
	Persona            *Persona            `gorm:"foreignKey:PersonaID" json:"persona,omitempty"`
	FichaCaracterizacion *FichaCaracterizacion `gorm:"foreignKey:FichaCaracterizacionID" json:"ficha_caracterizacion,omitempty"`
	Asistencias        []AsistenciaAprendiz `gorm:"foreignKey:AprendizFichaID" json:"asistencias,omitempty"`
}

// TableName especifica el nombre de la tabla
func (Aprendiz) TableName() string {
	return "aprendices"
}
