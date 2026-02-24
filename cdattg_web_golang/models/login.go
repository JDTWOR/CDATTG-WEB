package models

import "time"

// Login representa un registro de login
type Login struct {
	BaseModel
	UserID    uint      `gorm:"column:user_id;not null" json:"user_id"`
	IPAddress string    `gorm:"size:45" json:"ip_address"`
	UserAgent string    `gorm:"size:255" json:"user_agent"`
	FechaLogin time.Time `gorm:"column:fecha_login;not null" json:"fecha_login"`
	
	// Relaciones
	User *User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// TableName especifica el nombre de la tabla
func (Login) TableName() string {
	return "logins"
}
