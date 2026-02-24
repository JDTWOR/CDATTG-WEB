package complementarios

import "github.com/sena/cdattg-web-golang/models"

// PersonaCaracterizacion representa la relación entre personas y caracterizaciones complementarias
type PersonaCaracterizacion struct {
	models.BaseModel
	PersonaID      uint `gorm:"column:persona_id;not null" json:"persona_id"`
	CaracterizacionID uint `gorm:"column:caracterizacion_id;not null" json:"caracterizacion_id"`
	
	// Relaciones
	Persona        *models.Persona        `gorm:"foreignKey:PersonaID" json:"persona,omitempty"`
	Caracterizacion *CategoriaCaracterizacionComplementario `gorm:"foreignKey:CaracterizacionID" json:"caracterizacion,omitempty"`
}

// TableName especifica el nombre de la tabla
func (PersonaCaracterizacion) TableName() string {
	return "persona_caracterizacion"
}
