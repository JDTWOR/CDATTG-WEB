package models

// Permission representa un permiso del sistema
type Permission struct {
	BaseModel
	Name     string `gorm:"uniqueIndex;size:100;not null" json:"name"`
	GuardName string `gorm:"size:50;default:web" json:"guard_name"`
}

// TableName especifica el nombre de la tabla
func (Permission) TableName() string {
	return "permissions"
}
