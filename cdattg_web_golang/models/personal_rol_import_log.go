// @module personal_rol_import_log
// @description Modelo de base de datos para el log de importaciones de roles de personal.
// @author JDTWOR
// @created 2026-08-14
package models

import "time"

// PersonalRolImportLog registra cada importación masiva de personal desde Excel.
// Tipo distingue el rol: "personal_operativo_apoyo" | "personal_administrativo" | "contratista".
type PersonalRolImportLog struct {
	ID               uint      `gorm:"primaryKey" json:"id"`
	Tipo             string    `gorm:"size:50;not null" json:"tipo"`
	Filename         string    `gorm:"size:255;not null" json:"filename"`
	UserID           uint      `gorm:"column:user_id;not null" json:"user_id"`
	ProcessedCount   int       `gorm:"column:processed_count;default:0" json:"processed_count"`
	DuplicatesCount  int       `gorm:"column:duplicates_count;default:0" json:"duplicates_count"`
	ErrorCount       int       `gorm:"column:error_count;default:0" json:"error_count"`
	Status           string    `gorm:"size:50;default:'completado'" json:"status"`
	CreatedAt        time.Time `gorm:"column:created_at" json:"created_at"`

	User *User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// TableName especifica el nombre de la tabla
func (PersonalRolImportLog) TableName() string {
	return "personal_rol_import_logs"
}