package models

import "time"

// RegistroActividades representa un registro de actividad del sistema
type RegistroActividades struct {
	BaseModel
	UserID      uint      `gorm:"column:user_id" json:"user_id"`
	Accion      string    `gorm:"size:100;not null" json:"accion"`
	Tabla       string    `gorm:"size:100" json:"tabla"`
	RegistroID  *uint     `gorm:"column:registro_id" json:"registro_id"`
	Detalles    string    `gorm:"type:text" json:"detalles"`
	FechaAccion time.Time `gorm:"column:fecha_accion;not null" json:"fecha_accion"`
	IPAddress   string    `gorm:"size:45" json:"ip_address"`
	
	// Relaciones
	User *User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// TableName especifica el nombre de la tabla
func (RegistroActividades) TableName() string {
	return "registro_actividades"
}
