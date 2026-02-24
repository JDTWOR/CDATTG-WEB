package models

// Role representa un rol del sistema
type Role struct {
	BaseModel
	Name     string `gorm:"uniqueIndex;size:100;not null" json:"name"`
	GuardName string `gorm:"size:50;default:web" json:"guard_name"`
	
	// Relaciones
	Permissions []Permission `gorm:"many2many:role_has_permissions;foreignKey:ID;joinForeignKey:role_id;References:ID;joinReferences:permission_id" json:"permissions,omitempty"`
}

// TableName especifica el nombre de la tabla
func (Role) TableName() string {
	return "roles"
}
