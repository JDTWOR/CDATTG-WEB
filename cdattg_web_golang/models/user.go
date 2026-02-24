package models

import (
	"time"
)

// User representa un usuario del sistema
type User struct {
	BaseModel
	Email           string    `gorm:"uniqueIndex;not null" json:"email"`
	Password        string    `gorm:"not null" json:"-"` // No exponer contraseña en JSON
	Status          bool      `gorm:"default:true" json:"status"`
	PersonaID       *uint     `gorm:"column:persona_id" json:"persona_id"`
	EmailVerifiedAt *time.Time `gorm:"column:email_verified_at" json:"email_verified_at"`
	
	// Relaciones (roles y permisos están solo en Casbin; ver authz)
	Persona *Persona `gorm:"foreignKey:PersonaID" json:"persona,omitempty"`
}

// TableName especifica el nombre de la tabla
func (User) TableName() string {
	return "users"
}
