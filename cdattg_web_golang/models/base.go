package models

import (
	"time"

	"gorm.io/gorm"
)

// BaseModel contiene campos comunes para todas las entidades
type BaseModel struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}

// UserAuditModel contiene campos de auditoría de usuario
type UserAuditModel struct {
	BaseModel
	UserCreateID *uint `gorm:"column:user_create_id" json:"user_create_id"`
	UserEditID   *uint `gorm:"column:user_edit_id" json:"user_edit_id"`
}
