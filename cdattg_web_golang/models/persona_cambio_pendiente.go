package models

import "time"

// PersonaCambioPendiente guarda cambios que un visitante hizo en su perfil y que requieren aprobación del vigilante.
type PersonaCambioPendiente struct {
	BaseModel
	PersonaID       uint       `gorm:"column:persona_id;not null;index" json:"persona_id"`
	Campos          string     `gorm:"column:campos;type:jsonb;not null" json:"campos"`
	Estado          string     `gorm:"column:estado;size:20;default:pendiente" json:"estado"`
	FotoPath        string     `gorm:"column:foto_path;size:255" json:"foto_path"`
	ValidadorID     *uint      `gorm:"column:validador_id" json:"validador_id"`
	ValidadoEn      *time.Time `gorm:"column:validado_en" json:"validado_en"`
	MotivoRechazo   string     `gorm:"column:motivo_rechazo;size:255" json:"motivo_rechazo"`

	Persona   *Persona `gorm:"foreignKey:PersonaID" json:"persona,omitempty"`
	Validador *User    `gorm:"foreignKey:ValidadorID" json:"validador,omitempty"`
}

func (PersonaCambioPendiente) TableName() string {
	return "persona_cambios_pendientes"
}
