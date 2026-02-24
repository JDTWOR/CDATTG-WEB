package models

// PersonaContactAlert representa una alerta de contacto de persona
type PersonaContactAlert struct {
	BaseModel
	PersonaID uint   `gorm:"column:persona_id;not null" json:"persona_id"`
	Tipo      string `gorm:"size:50;not null" json:"tipo"` // EMAIL, TELEFONO, CELULAR
	Valor     string `gorm:"size:255;not null" json:"valor"`
	Mensaje   string `gorm:"type:text" json:"mensaje"`
	Status    bool   `gorm:"default:true" json:"status"`
	
	// Relaciones
	Persona *Persona `gorm:"foreignKey:PersonaID" json:"persona,omitempty"`
}

// TableName especifica el nombre de la tabla
func (PersonaContactAlert) TableName() string {
	return "persona_contact_alerts"
}
