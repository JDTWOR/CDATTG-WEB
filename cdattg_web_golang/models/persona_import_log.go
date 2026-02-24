package models

import "time"

// PersonaImportLog registra cada importación masiva de personas
type PersonaImportLog struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	Filename        string    `gorm:"size:255;not null" json:"filename"`
	UserID          uint      `gorm:"column:user_id;not null" json:"user_id"`
	ProcessedCount  int       `gorm:"column:processed_count;default:0" json:"processed_count"`
	DuplicatesCount int       `gorm:"column:duplicates_count;default:0" json:"duplicates_count"`
	ErrorCount      int       `gorm:"column:error_count;default:0" json:"error_count"`
	Status          string    `gorm:"size:50;default:'completado'" json:"status"` // completado, error, procesando
	CreatedAt       time.Time `gorm:"column:created_at" json:"created_at"`

	User *User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// TableName especifica el nombre de la tabla
func (PersonaImportLog) TableName() string {
	return "persona_import_logs"
}
