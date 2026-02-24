package models

// PersonaCaracterizacion representa una categoría de caracterización de persona
type PersonaCaracterizacion struct {
	BaseModel
	Nombre string `gorm:"size:255;not null" json:"nombre"`
}

// TableName especifica el nombre de la tabla
func (PersonaCaracterizacion) TableName() string {
	return "persona_caracterizaciones"
}
